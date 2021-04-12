import fs from 'fs-extra';
import Path from 'path';

const USERS_FILE = Path.resolve(__dirname, '../data/userControl.json');

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify({
            superuser: [],
            ban: {
                user: [],
                group: []
            }
        }, 2)
    );
}

let list = fs.readJsonSync(USERS_FILE);

function updateUsersFile() {
    fs.writeFile(USERS_FILE, JSON.stringify(list, 2));
}

function ban(type, id) {
    switch (type) {
        case 'u':
            list.ban.user.push(id);
            break;
        case 'g':
            list.ban.group.push(id);
            break;
    }
    updateUsersFile();
}

function checkBan(u, g = 0) {
    if (list.ban.user.includes(u)) return true;
    if (g != 0 && list.ban.group.includes(g)) return true;
    return false;
}

function addSu(user_id) {
    list.superuser.push(user_id);
    updateUsersFile();
}

function updateRole(context) {
    if (context.sender && list.superuser.includes(context.user_id)) context.sender.role = "SU";
    return context;
}

export default {ban, checkBan, addSu, updateRole};