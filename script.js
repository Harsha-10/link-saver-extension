document.addEventListener('DOMContentLoaded', function () {
    const formContainer = document.getElementById('formContainer');
    const checkbox = document.getElementById('checkbox');
    const sendButton = document.getElementById('send-button');
    const emailInput = document.getElementById('email-input');
    const toggle = document.querySelector('.c-form__toggle');
    const linksContainer = document.querySelector('.links');
    const currentTab = document.getElementById('add-current-tab');
    const search = document.getElementById('search');
    const del = document.getElementById('delete');
    const exp = document.getElementById('export');
    const add = document.getElementById('add-url');
    const urlInput = document.getElementById('email-input');

    if (add && urlInput) {
        add.click();
        setTimeout(() => {
            urlInput.focus();
        }, 300);
    }

    if (!formContainer || !checkbox || !sendButton || !emailInput || !toggle || !linksContainer) {
        return;
    }
    
    function resetToNotifyMe() {
        checkbox.checked = false;
        emailInput.value = '';
    }

    function validateUrl(url) {
        const urlPattern = /^(https?:\/\/)?([\w\d-]+\.)+[\w-]+(\:\d+)?(\/[\w- ./?%&=:@#]*)?$/;
        const isValid = urlPattern.test(url);
        return isValid;
    }
    sendButton.addEventListener('click', function () {
        const url = emailInput.value;
        if (!validateUrl(url)){
            showToast("Invalid URL!",'#DC143C');
        }
    });

    sendButton.addEventListener('click', function () {
        const url = emailInput.value;
        resetToNotifyMe();
        if (validateUrl(url)) {
            saveLink(url).then(() => {
                renderLinks();
            });
        }
    });
    emailInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            sendButton.click(); 
        }
    });

    document.addEventListener('click', function (event) {
        const isClickInsideForm = formContainer.contains(event.target);
        const isClickOnButton = event.target === sendButton;

        if (!isClickInsideForm && !isClickOnButton) {
            resetToNotifyMe();
        }
    });



    exp.addEventListener('click', function () {
        chrome.storage.local.get(['links'], (result) => {
            const links = result.links || [];
            let htmlContent = '<html><head><meta charset="utf-8"></head><body>';
            links.forEach(link => {
                htmlContent += '<p><a href="' + link.url + '" target="_blank">' + link.url + '</a></p>';
            });
            htmlContent += '</body></html>';
            const docxBlob = htmlDocx.asBlob(htmlContent);
            saveAs(docxBlob, 'links.docx');
        });
    });

    del.addEventListener('click',function() {
        chrome.storage.local.set({ links: [] }, () => {
            renderLinks();
        });
    })
    function showToast(message,clr) {
        Toastify({
            text: message,
            className: "info",
            duration:2000,
            close: true,
            style: {
                background: clr,
                transform: "translate(0px, 0px); top: 75px"
                }
            }).showToast();
    }
    function saveLink(url) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['links'], (result) => {
                const links = result.links || [];
                const isDuplicate = links.some(link => link.url === url);
                if (isDuplicate) {
                    showToast("URL already added!",'#DC143C');
                    resolve();
                } else {
                    links.unshift({ url: url });
                    showToast("Added!",'#006400');
                    chrome.storage.local.set({ links: links }, () => {
                        resolve();
                    });
                }
            });
        });
    }

    currentTab.addEventListener('click', function (event) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = tabs[0].url;
            saveLink(url).then(() => {
                renderLinks();
            });
        });
    });

    linksContainer.addEventListener('click', function (event) {
        const target = event.target.closest('button');
        if (!target) return;

        if (target.classList.contains('copy-btn')) {
            const index = target.getAttribute('data-index');
            const copyIcon = target.querySelector('.fa-copy');
            const checkIcon = target.querySelector('.fa-check');

            chrome.storage.local.get(['links'], (result) => {
                const links = result.links || [];
                navigator.clipboard.writeText(links[index].url).then(() => {
                    copyIcon.style.display = 'none';
                    checkIcon.style.display = 'inline';

                    setTimeout(() => {
                        copyIcon.style.display = 'inline';
                        checkIcon.style.display = 'none';
                    }, 500); 
                });
        });
        } else if (target.classList.contains('delete-btn')) {
            const index = target.getAttribute('data-index'); 
            chrome.storage.local.get(['links'], (result) => {
                const links = result.links || [];
                links.splice(index, 1);
                chrome.storage.local.set({ links: links }, () => {
                    renderLinks(); 
                    showToast('Deleted!',"#DC143C");
                });
            });
        }
        else if (target.classList.contains('qr-btn')) {
            chrome.storage.local.get(['links'], (result) => {
                const index = target.getAttribute('data-index');
                const links = result.links || [];
                const url = links[index].url;
                const tempContainer = document.createElement('div');
                const qrCode = new QRCode(tempContainer, {
                    text: url,
                    width: 128,
                    height: 128,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                setTimeout(() => {
                    const qrCodeImage = tempContainer.querySelector('img').src;
                    showToastWithImage(qrCodeImage);
                }, 500);
                });
        }
    });

    
    function extractMainTerm(url, maxLength = 30) {
        try {
            const parsedUrl = new URL(url);
            let hostname = parsedUrl.hostname;
            if (hostname.startsWith('www.')) {
                hostname = hostname.substring(4);
            }
            const pathname = parsedUrl.pathname;
            let fullText = `${hostname}${pathname}`;
            if (fullText.length > maxLength) {
                const truncatedText = fullText.slice(0, maxLength - 3) + '...';
                if(truncatedText===''){
                }
                return truncatedText;
            }
            return fullText;
        } catch (error) {
            return '';
        }
    }
    function showToastWithImage(imgsrc) {
        const toast = Toastify({
            node: createToastContentWithImage(imgsrc),
            duration: 0,
            gravity: 'top', 
            position: 'center',
            className: 'background'
        }).showToast();
        function closeToast() {
            toast.hideToast();
            document.removeEventListener('click', closeToast);
        }
        document.addEventListener('click', function(event) {
            if (!toast.toastElement.contains(event.target)) {
                closeToast();
            }
        });
        document.querySelector('.toast-close1').addEventListener('click', () => {
            toast.hideToast();
        });
    }
    function createToastContentWithImage(imageUrl) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.color = '#fff';
        container.style.padding = '0';
    
        const image = document.createElement('img');
        image.src = imageUrl;
        image.style.width = '150px'; 
        image.style.height = '150px'; 
        image.style.borderRadius = '5%';
        image.style.margin = '0';
        image.style.padding = '0';
        container.appendChild(image);

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.className = 'toast-close1';
        container.appendChild(closeButton);

        return container;
    }
    function renderLinks(filteredLinks) {
        chrome.storage.local.get(['links'], (result) => {
            const links = filteredLinks || result.links || [];
            linksContainer.innerHTML = '';
            links.forEach((link, index) => {
                if (link && link.url) {
                    const mainTerm = extractMainTerm(link.url);
                    const linkElement = document.createElement('div');
                    linkElement.className = 'link-item';
                    linkElement.innerHTML = `
                        <a href="${link.url}" target="_blank">${mainTerm}</a>
                        <div>
                        <button class="qr-btn" id="qr" data-index="${index}">
                            <i class="fa-solid fa-qrcode"></i>
                        </button>
                        </div>
                        <button class="copy-btn" data-index="${index}">
                            <i class="fas fa-copy"></i>
                            <i class="fa-solid fa-check" style="display: none;"></i>
                        </button>
                        <button class="delete-btn" data-index="${index}">
                            <i class="fa-solid fa-trash fa-flip-horizontal fa-2xs"></i>
                        </button>
                    `;
                    linksContainer.appendChild(linkElement);
                }
            });
        });
    }

    search.addEventListener('input', function () {
        const query = search.value.toLowerCase();
        chrome.storage.local.get(['links'], (result) => {
            const links = result.links || [];
            const filteredLinks = links.filter(link => link.url.toLowerCase().includes(query));
            console.log(filteredLinks);
            renderLinks(filteredLinks);
        });
    });
    
    renderLinks();
});
