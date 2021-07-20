$(document).ready(function () {
    if (docid === undefined || docid === null) {
        let info = $('#error-div');
        info.html('');
        info.append('Object ID is missing!');
        info.show();
        return;
    }

    if (channelID === undefined || channelID === null) {
        let info = $('#error-div');
        info.html('');
        info.append('Channel ID is missing!');
        info.show();
        return;
    }

    if (chaincode === undefined || chaincode === null) {
        let info = $('#error-div');
        info.html('');
        info.append('Chaincode ID is missing!');
        info.show();
        return;
    }

    getDoc(docid, chaincode);
});