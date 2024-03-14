# ZK-MIXER on JS
This repository contains a zk-mixer demo based on TornadoCash design. This version of the zk-mixer(v1) differs in two ways with Tornado: first instead of using Pedersen hash to calculate leaf value(Hash(secret||nullifier)) and nullifierHash(Hash(nullifier)) we have used the MiMCSponge hash function. We need to use the WebAssembly code extracted from Circom compilation of the Pedersen function which will be done in the next version.

Another difference is that Tornado insert function does not return HashPairings or HashDirection arrays used to generate the proof, it will only return the index of the inserted commitment. Later when user wants to generate he's proof, he pulls the commitments present on the contract using 'contract.queryFilter' and reconstructs the commitments array to generate the proof using his known index and secret inputs. Not all roots are valid forever in Tornado, only the recent 30 valid roots remain on chain, user has to construct his proof and submit his withdraw transaction before 30 successful deposit transactions. We will add a function to generate the PathElements and PathIndices arrays by having the index in the next version. 

# How to run ZK-MIXER
To run this demo first run 
```code 
npm install
``` 
to install the required node modules and then run 
```code
npm run mixer
``` 
to run the application.
