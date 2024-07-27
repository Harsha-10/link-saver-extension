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