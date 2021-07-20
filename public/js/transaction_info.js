$(document).ready(function () {
    if (txid === undefined || txid === null) {
        let info = $('#transaction-error-div');
        info.html('');
        info.append('Transaction ID is missing!');
        info.show();
        return;
    }

    if (channelID === undefined || channelID === null) {
        let info = $('#transaction-error-div');
        info.html('');
        info.append('Channel ID is missing!');
        info.show();
        return;
    }

    getTransaction(txid);
});