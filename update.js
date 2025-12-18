const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const userAgent = "Jellyfin-Server/10.11.4"; // Required for some repositories

const imagesDir = path.join(__dirname, 'images');
const imageBaseUrl = 'https://raw.githubusercontent.com/0belous/universal-plugin-repo/refs/heads/main/images/';

async function getSources(){
    let sources = [];
    try {
        const fileContent = await fs.readFile('sources.txt', 'utf8');
        sources = fileContent.split(/\r?\n/).filter(line => line.trim() !== '' && !line.trim().startsWith('#'));
    } catch (err) {
        console.error("Error reading sources.txt:", err);
        return [];
    }

    let mergedData = [];

    for(const url of sources){
        try {
            console.log(`Fetching ${url}...`);
            const response = await fetch(url, {
                headers: { 'User-Agent': userAgent }
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const json = await response.json();
            mergedData.push(...json);
            console.log(`    -> Merged ${json.length} plugins.`);

        } catch (error) {
            console.error(`Error processing ${url}: ${error.message}`);
        }
    }

    return mergedData;
}

async function clearImagesFolder() {
    try {
        await fs.rm(imagesDir, { recursive: true, force: true });
        await fs.mkdir(imagesDir, { recursive: true });
    } catch (err) {
        console.error('Error clearing images folder:', err);
    }
}

async function downloadImage(url, filename) {
    console.log(`Downloading image: ${url} as ${filename}`);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
        const buffer = await res.arrayBuffer();
        await fs.writeFile(path.join(imagesDir, filename), Buffer.from(buffer));
        return true;
    } catch (err) {
        console.error(`Error downloading image ${url}:`, err.message);
        return false;
    }
}

function getImageExtension(url) {
    const ext = path.extname(new URL(url).pathname);
    return ext || '.png';
}

function getPluginId(plugin) {
    return plugin.id || plugin.Id || plugin.pluginId || plugin.name || null;
}

function hashString(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function findGithubUrl(obj) {
    if (!obj) return null;
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            const match = obj[key].match(/https?:\/\/github\.com\/[^\/]+\/[^\/]+/);
            if (match) {
                return match[0];
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            const url = findGithubUrl(obj[key]);
            if (url) return url;
        }
    }
    return null;
}

async function processDescriptions(pluginData) {
    try {
        for (const plugin of pluginData) {
            const repoUrl = findGithubUrl(plugin);
            if (repoUrl) {
                const sourceLink = `\n\n${repoUrl}`;
                const descriptionProp = ['description', 'Description', 'overview'].find(p => plugin[p]);

                if (descriptionProp) {
                    if (!plugin[descriptionProp].includes(repoUrl)) {
                        plugin[descriptionProp] += sourceLink;
                    }
                } else {
                    plugin.description = sourceLink.trim();
                }
            }
        }
    console.log(`Sucessfully injected source URLs`);
    } catch (err) {
        console.error('Error processing descriptions:', err);
    }
}

async function processImages(pluginData) {
    await clearImagesFolder();
    for (const plugin of pluginData) {
        if (plugin.imageUrl) {
            const ext = getImageExtension(plugin.imageUrl);
            let pluginId = getPluginId(plugin);
            if (!pluginId) {
                pluginId = hashString(plugin.imageUrl);
            }
            const filename = `${pluginId}${ext}`;
            const success = await downloadImage(plugin.imageUrl, filename);
            if (success) {
                plugin.imageUrl = imageBaseUrl + filename;
                console.log(`    -> Updated manifest imageUrl for plugin ${pluginId}`);
            }
        }
    }
}

async function writeManifest(dataToWrite){
    if (!dataToWrite || dataToWrite.length === 0) {
        console.log("No data to write to manifest. Aborting.");
        return;
    }
    try {
        const manifestJson = JSON.stringify(dataToWrite, null, 2);
        await fs.writeFile('manifest.json', manifestJson);
    } catch (err) {
        console.error('Error writing manifest file:', err);
    }
    console.log(`\nSuccessfully created manifest.json with ${dataToWrite.length} total plugins`);
    console.log('Manifest updated with new image URLs.');
}

async function main() {
    const plugins = await getSources();
    await processDescriptions(plugins);
    await processImages(plugins);
    await writeManifest(plugins);
}

main();
