const fs = require('fs');
const path = require('path');

const cachePath = path.join(__dirname, "cache.json");

let cache = {};

// LOAD
function loadCache(){
    try{
        if(fs.existsSync(cachePath)){
            const data = fs.readFileSync(cachePath,"utf-8");

            if(!data || data.trim()===""){
                cache = {};
                return;
            }

            cache = JSON.parse(data);
            console.log("Cache Loaded");
        }
    }catch{
        cache = {};
    }
}

// SAVE FILE
function saveFile(){
    fs.writeFileSync(cachePath, JSON.stringify(cache,null,2));
}

// GET
function getFromCache(query){
    return cache[query];
}

// SAVE
function saveToCache(query,answer){
    cache[query] = answer;
    saveFile();
}

module.exports = {
    loadCache,
    getFromCache,
    saveToCache
};