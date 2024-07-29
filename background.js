function updateBadge() {
    chrome.storage.local.get(['links'], (result) => {
        const links = result.links || [];
        const count = links.length;
        chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
        chrome.action.setBadgeBackgroundColor({ color: '#e0e0e0' }); 
    });
}
chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener(updateBadge); 

chrome.commands.onCommand.addListener((command) => {
    if (command === "_execute_action") {
        chrome.action.openPopup();
    }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveLink",
        title: "Save Link",
        contexts: ["link"]
    });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveLink") {
        const url = info.linkUrl;
        saveLink(url);
    }
});
function saveLink(url) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['links'], (result) => {
            const links = result.links || [];
            const isDuplicate = links.some(link => link.url === url);
            if (isDuplicate) {
                resolve();
            } else {
                links.push({ url: url });
                chrome.storage.local.set({ links: links }, () => {
                    resolve();
                });
            }
        });
    });
}