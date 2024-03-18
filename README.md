# ZK-MIXER on JS
This repository contains a zk-mixer demo based on TornadoCash design. While Tornado uses Pedersen hash function to calculate the leaf nodes of its Merkle tree and MiMC hash function to calculate the path to the root, we use MiMC for both of them. 

This demo runs a Merkle tree of 3 levels with capacity of 8 leafs and root history of 2.

# How to run ZK-MIXER
To run this demo first run 
```code 
npm install
``` 
to install the required node modules. 

to generate the proving and verifying key of the circuit run
```code
npm run generator
```

Then run the mixer using this command
```code
npm run mixer
``` 

