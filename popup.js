console.log("Popup is running");
let _clipboardList = document.querySelector("#clipboard_list");
let _itemCount = document.querySelector("#item-count");

function updateItemCount(count) {
    if (_itemCount) {
        _itemCount.textContent = count === 1 ? '1 item' : `${count} items`;
    }
}

function getClipboardText(){
    chrome.storage.local.get(['list'], clipboard => {
        let list = clipboard.list;
        let emptyDiv = document.getElementById('empty-state');
        
        if (list === undefined || list.length === 0) {
            emptyDiv.classList.remove('hide');
            updateItemCount(0);
        } else {
            emptyDiv.classList.add('hide');
            updateItemCount(list.length);
            if (typeof list !== undefined) {
                list.forEach(item => {
                    console.log(item);
                    addClipboardListItem(item);
                });
            }
        }
    });
}

function getThumbnail(textContent){
    console.log(textContent);
    let ind = textContent.indexOf('https://www.youtube.com/');
    if (ind === 0) {
        let videoId = "";
        let idIndex = textContent.indexOf('watch?v=');
        let endIndex = textContent.indexOf('&');
        console.log(`${idIndex} ${endIndex}`);
        if (endIndex !== -1)
            videoId = textContent.substring(idIndex + 8, endIndex);
        else
            videoId = textContent.substring(idIndex + 8, textContent.length);
        let url = `https://img.youtube.com/vi/${videoId}/1.jpg`;
        console.log(`https://img.youtube.com/vi/${videoId}/1.jpg`);
        return {
            sourceUrl: textContent,
            imageUrl: url,
            isVideo: true,
        };
    } else {
        let ind = textContent.indexOf('http');
        if (ind === 0) {
            let url = new URL(textContent);
            let ans = "https://favicons.githubusercontent.com/" + url.hostname;
            return {
                sourceUrl: textContent,
                imageUrl: ans,
                isVideo: false
            }
        }
    }
    return {
        sourceUrl: "",
        imageUrl: ""
    };
}

function addClipboardListItem(text){
    let {sourceUrl, imageUrl, isVideo} = getThumbnail(text);
    let listItem = document.createElement("li"),
        listDiv = document.createElement("div"),
        deleteDiv = document.createElement("div"),
        contentDiv = document.createElement("div");
        deleteButton = document.createElement("a"),
        deleteImage = document.createElement("img");
        listPara = document.createElement("p"),
        listText = document.createTextNode(text),
        popupLink = document.createElement('a'),
        imagePopup = document.createElement('img');
    
    if (imageUrl.length > 0) {
        console.log("Image Url found");
        imagePopup.src = imageUrl;
        popupLink.href = sourceUrl;
        popupLink.target = '_blank';
        popupLink.appendChild(imagePopup);
        listDiv.appendChild(popupLink);
    }
    
    listPara.appendChild(listText);
    listDiv.appendChild(listPara);
    listDiv.classList.add("list-div");
    contentDiv.appendChild(listDiv);
    
    deleteImage.src = 'https://cdn.iconscout.com/icon/premium/png-256-thumb/delete-1432400-1211078.png';
    deleteImage.classList.add("delete");
    
    deleteDiv.appendChild(deleteImage);
    contentDiv.appendChild(deleteDiv);
    contentDiv.classList.add("content");
    listItem.appendChild(contentDiv);

    _clipboardList.appendChild(listItem);
    
    deleteImage.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log("Delete clicked");
        chrome.storage.local.get(['list'], clipboard => {
            let list = clipboard.list;
            let index = list.indexOf(text);
            list.splice(index, 1);
            _clipboardList.innerHTML = "";
            chrome.storage.local.set({'list': list}, () => getClipboardText());
        });
    });
    
    listDiv.addEventListener('click', (event) => {
        let {textContent} = event.target;
        navigator.clipboard.writeText(textContent)
        .then(() => {
            console.log(`Text saved to clipboard`);
            chrome.storage.local.get(['list'], clipboard => {
                let list = clipboard.list;
                let index = list.indexOf(textContent);
                if (index !== -1)
                    list.splice(index, 1);

                list.unshift(textContent);
                _clipboardList.innerHTML = "";
                chrome.storage.local.set({'list': list}, () => getClipboardText());
            });
        });
        
        let x = document.getElementById("snackbar");
        x.classList.add("show");
        setTimeout(function(){ 
            x.classList.remove("show"); 
        }, 3000);
    });
}

getClipboardText();