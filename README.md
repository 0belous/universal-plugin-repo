# Universal Plugin Repo
### Universal plugin repository for Jellyfin Media Server

> [!NOTE]
> Updated every 24 hours, or whenever a change is pushed to this project

# Installation
1. Open Jellyfin dashboard
2. Navigate to the catalogue settings
3. (Optional) Remove all old repositories including the default jellyfin repo, this speeds up catalogue loading
4. Add the universal repository
```
https://obelo.us/upr
```
5. Never add another repository again!

<details>
<summary>More plugins</summary>
  
You can optionally install the NSFW repository as well

```
https://obelo.us/uprn
```
</details>

# Security
Most sources come from [awesome-jellyfin](https://github.com/awesome-jellyfin/awesome-jellyfin)
The remainder are from reputable developers, and each source is reviewed before being added.
There is minimal risk in having even a known bad repository installed, as this project acts as a proxy between your server and a potentially malicious repository, helping to protect your IP. However, this protection no longer applies once you install a plugin, as the code is not proxied and could contain malware.

Make sure you only install plugins you recognise.

# Contribution
If you find a plugin that is not included, please take a few minutes to add it to sources.txt and create a pull request.
