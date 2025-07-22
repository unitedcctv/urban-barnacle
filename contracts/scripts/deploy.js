const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ItemNFT contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const ItemNFT = await ethers.getContractFactory("ItemNFT");
  const itemNFT = await ItemNFT.deploy();
  await itemNFT.deployed();

  console.log("ItemNFT deployed to:", itemNFT.address);

  // Save the contract address and ABI for the backend to use
  const contractInfo = {
    address: itemNFT.address,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  // Create deployment info directory if it doesn't exist
  const deploymentDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }

  // Save contract info
  fs.writeFileSync(
    path.join(deploymentDir, `ItemNFT-${hre.network.name}.json`),
    JSON.stringify(contractInfo, null, 2)
  );

  // Copy ABI to backend
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ItemNFT.sol", "ItemNFT.json");
  const backendContractsDir = path.join(__dirname, "..", "..", "backend", "contracts");
  
  if (!fs.existsSync(backendContractsDir)) {
    fs.mkdirSync(backendContractsDir, { recursive: true });
  }

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(backendContractsDir, "ItemNFT.json"),
      JSON.stringify({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        ...contractInfo
      }, null, 2)
    );
    console.log("Contract ABI and info saved to backend/contracts/");
  }

  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
