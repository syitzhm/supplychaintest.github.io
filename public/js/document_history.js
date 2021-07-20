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

    getHistory(docid, chaincode);
});

function getHistory(id, chaincode) {
    hideSearchError();

    $.get(`/api/v1/insight/org/org1/channel/${channelID}/chaincode/${chaincode}/history/${id}`,
        function (results) {

            if (results.length < 1) {
                let error = {
                    responseText: 'Object not found'
                }
                showSearchError(error);
                return
            }
            
            results.sort(function(a, b) {
                let date1 = new Date(a.Timestamp);
                let date2 = new Date(b.Timestamp);
                return date2 - date1;
            })

            var htmlContent = ``;
            for (let obj of results) {
                let doc = obj.Value;

                if (doc.hasOwnProperty('content')) {
                    var content = doc.content;
                    try {
                        content = JSON.parse(content);
                    } catch (e) {
                        break;
                    }
                    while ((typeof content) === 'string') {
                        try {
                            content = JSON.parse(content);
                        } catch (e) {
                            break;
                        }
                    }
                    doc.content = content;
                }
                let date = new Date(obj.Timestamp);
                let dateString = moment(date).format('HH:mm:ss DD/MM/YYYY');
                htmlContent += `<strong>Transaction: <a href="/txid/${obj.TxId}" target="_blank">${obj.TxId}</a>, at ${dateString}</strong><pre>${JSON.stringify(doc, null, 2)}</pre>`;
            }

            let container = $('#object-info-container');
            container.show();

            var info = $('#object-info');
            info.html(htmlContent);
        })
        .fail(function (e) {
            showSearchError(e);
        })
}