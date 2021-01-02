pragma solidity >=0.7.0 <0.8.0;

contract CampaignFactory {
    
    address[] public deployedCampaigns;
    
    
    function createCampaign(uint minimum) public {
        Campaign newCampaign=new Campaign(minimum,msg.sender);
        deployedCampaigns.push(address(newCampaign));
    }
    
    function getDeployedCampaigns() public view returns(address[] memory) {
        return deployedCampaigns;
    }
}


contract Campaign {
    
    struct Request {
        string description;
        uint value;
        address recipient;
        bool complete;
        uint approvalCount;
    }
    
    address public manager;
    uint public minimumContribution;
    mapping(address=>bool) public contributors;
    uint public contributorsCount;
    mapping(uint=>mapping(address=>bool)) public requestApprovals;
    Request[] public requests;
    uint public numRequests;
    
    
    modifier restricted() {
        require(msg.sender==manager);
        _;
    }
    
    
    constructor(uint minimum,address creator) {
        numRequests=0;
        contributorsCount=0;
        manager=creator;
        minimumContribution=minimum;
    }
    
    function contribute() public payable {
        require(msg.value>=minimumContribution);
        require(!contributors[msg.sender]);
        contributors[msg.sender]=true;   
        contributorsCount++;
    }
    
    function createRequest(string calldata description, uint value, address recipient) public restricted {
        Request memory request =  Request({
            description:description,
            value:value,
            complete:false,
            approvalCount:0,
            recipient:recipient
        });
        requests.push(request);
        numRequests++;
    }
    
    function approveRequest(uint index) public {
        require(contributors[msg.sender]);
        require(!requestApprovals[index][msg.sender]);
        Request storage request=requests[index];
        requestApprovals[index][msg.sender]=true;
        request.approvalCount++;
    }
    
    function finalizeRequest(uint index) public restricted {
        Request storage request=requests[index];
        require(!request.complete);
        require(request.approvalCount>(contributorsCount/2));
        payable(address(request.recipient)).transfer(request.value);
        request.complete=true;
        
    }
    
}