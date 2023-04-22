const sha256 = async (file) => {
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

class Blockchain {
    constructor() {
        this.chain = [this.createBlock()];
        this.pendingTransactions = [];
    }

    createBlock() {
        return {
            index: 0,
            timestamp: Date.now(),
            transactions: [],
            nonce: 0,
            contentID: "",
            fileHash: "",
            hash: "",
            previousBlockHash: "PreGenesisHash",
        };
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    };

    async generateHash(previousBlockHash, timestamp, pendingTransactions) {
        let hash = "";
        let nonce = 0;

        while (hash.substring(0, 4) !== "0000") {
            nonce++;
            const data = previousBlockHash + timestamp + JSON.stringify(pendingTransactions) + nonce;
            const buffer = new TextEncoder().encode(data);
            const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        }

        return { hash, nonce };
    }


    createNewTransaction(amount, sender, recipient) {
        const newTransaction = {
            amount,
            sender,
            recipient,
        };

        this.pendingTransactions.push(newTransaction);
    }

    async mineBlock() {
        const file = document.getElementById('fileInput').files[0];
        const contentID = 'https://dweb.link/ipfs/' + window.cid;
        const timestamp = Date.now();
        const transactions = this.pendingTransactions;
        const previousBlockHash = this.getLastBlock().hash;
        const fileHash = await sha256(file);
        const { hash, nonce } = await this.generateHash(previousBlockHash, timestamp, transactions);

        const newBlock = {
            index: this.chain.length,
            timestamp,
            transactions,
            contentID,
            nonce,
            fileHash,
            hash,
            previousBlockHash,
        };

        this.pendingTransactions = [];
        this.chain.push(newBlock);

        console.log("New block added to the blockchain:", newBlock);
    }

    viewUser() {
        console.log(this);
    }


    async verifyTransaction() {

        for (let i = 1; i < this.chain.length; i++) {
            let currentBlock = this.chain[i];
            let previousBlock = this.chain[i - 1];

            //comparing registered hash and calculated hash
            const { hash } = await this.generateHash(previousBlock.hash, currentBlock.timestamp, currentBlock.transactions);
            if (currentBlock.hash !== hash) {
                console.log("Current Hashes not equal");
                return false;
            }

            //compare previous hash and registered previous hash
            if (previousBlock.hash !== currentBlock.previousBlockHash) {
                console.log("Previous Hashes not equal");
                return false;
            }

            //check if hash is solved
            if (currentBlock.hash.substring(0, 4) !== "0000") {
                console.log("This Block Has not been Mined");
                return false;
            }
        }
        return true;
    }
}

let BlockDoc = new Blockchain();

const createBlock = () => {
    BlockDoc.mineBlock();
    let a = BlockDoc.verifyTransaction();
    if (!a) {
        BlockDoc.chain.pop();
    }
}

const removeBlock = () => {
    BlockDoc.chain.pop();
}

const viewUser = () => {
    BlockDoc.viewUser();
}