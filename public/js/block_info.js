$(document).ready(function () {
    if (block_num === undefined || block_num === null) {
        let info = $('#block-error-div');
        info.html('');
        info.append('Block index is missing!');
        info.show();
        return;
    }

    if (channelID === undefined || channelID === null) {
        let info = $('#block-error-div');
        info.html('');
        info.append('Channel ID is missing!');
        info.show();
        return;
    }

    getBlockInfo(block_num - 1);
});