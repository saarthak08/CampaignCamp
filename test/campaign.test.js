const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let factory;
let accounts;
let campaignAddress;
let campaign;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();

	factory = await new web3.eth.Contract(compiledFactory.abi)
		.deploy({ data: compiledFactory.evm.bytecode.object })
		.send({ gas: 1000000, from: accounts[0] });

	await factory.methods.createCampaign("100").send({
		from: accounts[0],
		gas: 1000000,
	});

	[campaignAddress] = await factory.methods.getDeployedCampaigns().call();

	campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe("Campaigns", () => {
	it("deploys a factory & a campaign", () => {
		assert.ok(factory.options.address);
		assert.ok(campaign.options.address);
	});
	it("deploys a factory and a campaign", () => {
		assert.ok(factory.options.address);
		assert.ok(campaign.options.address);
	});

	it("marks caller as the campaign manager", async () => {
		const manager = await campaign.methods.manager().call();
		assert.equal(manager, accounts[0]);
	});

	it("allows people to contribute money", async () => {
		await campaign.methods.contribute().send({
			value: "200",
			from: accounts[1],
		});
	});

	it("requires a minimum contribution", async () => {
		try {
			await campaign.methods.contribute().send({
				value: "5",
				from: accounts[1],
			});
			assert(false);
		} catch (error) {
			assert(error);
		}
	});

	it("allows a manager to make a payment request", async () => {
		await campaign.methods
			.createRequest("Buy batteries", "100", accounts[1])
			.send({
				from: accounts[0],
				gas: "1500000",
			});

		const request = await campaign.methods.requests(0).call();
		assert("Buy batteries", request.description);
	});

	it("processes requests", async () => {
		await campaign.methods.contribute().send({
			value: web3.utils.toWei("10", "ether"),
			from: accounts[1],
		});

		// Create a spend request for 5 ether to go to accounts[2].
		await campaign.methods
			.createRequest(
				"A cool spend request",
				web3.utils.toWei("5", "ether"),
				accounts[2]
			)
			.send({
				from: accounts[0],
				gas: "1500000",
			});

		// Approve the spend request.
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: "1500000",
		});

		// Finalize the request.
		await campaign.methods.finalizeRequest(0).send({
			from: accounts[0],
			gas: "1500000",
		});

		let balance = await web3.eth.getBalance(accounts[2]);
		balance = web3.utils.fromWei(balance, "ether");
		balance = parseFloat(balance);

		assert(balance > 104);
	});
});
