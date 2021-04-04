let gUserStatus = {};

function entryStat(context, status, exit_delay = 20000) {
    const kGroup_id = context.group_id;
    const kUser_id = context.user_id;

    gUserStatus[kGroup_id] == undefined ? 
    gUserStatus[kGroup_id] = {[kUser_id]: status} : 
    gUserStatus[kGroup_id][kUser_id] = status;

    if (exit_delay && exit_delay > 0) exitStatLater(context, exit_delay);
}

function exitStatLater(context, exit_delay = 20000) {
    setTimeout(exitStat, exit_delay, context);
}

function exitStat(context) {
    if (!gUserStatus[context.group_id]) return false;
    const kUser = 
        gUserStatus[context.group_id][context.user_id] || false;
    
    if (kUser) delete gUserStatus[context.group_id][context.user_id];
    if (Object.keys(gUserStatus[context.group_id]).length == 0) delete gUserStatus[context.group_id];
}

function checkStat(context) {
    if (!gUserStatus[context.group_id]) return false;
    return gUserStatus[context.group_id][context.user_id];
}

export {entryStat, checkStat, exitStat};