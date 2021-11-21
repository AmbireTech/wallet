import TransportWebHID from "@ledgerhq/hw-transport-webhid"
import AppEth from "@ledgerhq/hw-app-eth"

let connectedDevices = null

export async function getLedgerAddresses (page, hdPath, t) {
    console.log(`connectLedger`, page, hdPath);
    try {
        let transport;
        connectedDevices = await TransportWebHID.list();
        console.log(connectedDevices);
        if(connectedDevices.length && connectedDevices[0].opened){
            transport = new TransportWebHID(connectedDevices[0])
            //transport = await TransportWebHID.open(connectedDevices[0]);
        }else{
            transport = await TransportWebHID.request();
        }
        console.log(transport)
        debugger
        transport.setDebugMode(true);
        const appEth = new AppEth(transport);
        const address = await appEth.getAddress("44'/60'/0'/0/0").then(o => o.address)
        /*console.log(addrData);
        const addresses = [];
        for(let i = 0; i < 10; i++){
            addresses.push()
        }*/
        if(transport){
            connectedDevices = transport.close();
        }
        return [address];
    } catch (error) {
        throw error;
    }
}
