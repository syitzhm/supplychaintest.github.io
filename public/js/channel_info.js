$(document).ready(function () {
    hideSearchError();
    getChannelInfo();
    $('#select-block-number').on('change', function () {
        getBlockInfo(this.value);
    });

    let selectedType = $('#select-search-type option:selected').val();
    searchTypeChanged(selectedType);
    $('#select-search-type').on('change', function () {
        searchTypeChanged(this.value);
    });

    if (txid) {
        $('#text-object-search').val(txid);
        getTransaction(txid);
    }
});


function getChannelInfo() {
    hideChannelError();

    $.get(`/api/v1/insight/org/org1/channel/${channelID}`,
        {},
        function (result) {
            var info = $('#info');
            info.html("");
            info.append(`<tr>
                    <th>Block count</th>
                    <td>${result.count}</td>
                    </tr>`);
            info.append(`<tr>
                    <th>Current Block Hash</th>
                    <td>${result.currentBlockHash}</td>
                    </tr>`);
            info.append(`<tr>
                    <th>Previous Block Hash</th>
                    <td>${result.previousBlockHash}</td>
                    </tr>`);

            var select = $('#select-block-number');
            select.html("");
            select.append(`<option disabled selected value> -- select a number -- </option>`);
            var i;
            for (i = 0; i < result.count; i++) {
                select.append(`<option value='${i}'>${i + 1}</option>`);
            }
        })
        .fail(function (e) {
            showChannelError(e);
        })
    $.get(`/api/v1/insight/org/org1/channel/${channelID}/chaincodes`,
        {},
        function (result) {
            var select = $('#select-search-chaincode');
            select.html("");
            select.append(`<option disabled selected value='0'> -- select a chaincode -- </option>`);
            for (let chaincode of result) {
                select.append(`<option value="${chaincode.name}">${chaincode.name} - ${chaincode.version}</option>`);
            }
        })
}

function search() {
    $('#search-info').html('');
    $("#search-info-container").css("margin-top", "");
    $('#object-info').html('');
    let type = $('#select-search-type option:selected').val();
    let id = $('#text-object-search').val();
    if (id === '') {
        alert("Please provide ID");
        return;
    }

    switch (type) {
        case '1':
            getTransaction(id);
            break;
        case '2':
            let chaincode = $('#select-search-chaincode option:selected').val();
            if (chaincode === '0') {
                alert("Please Choose a chaincode");
                return;
            }
            getLog(id, chaincode);
            break;
        default: break;
    }
}
