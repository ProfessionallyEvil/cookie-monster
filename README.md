# Cookie Monster

![alt text](https://github.com/ProfessionallyEvil/cookie-monster/blob/main/CookieMonster.png?raw=true)

## What is Cookie Monster?

Cookie Monster is a proof-of-concept data exfiltration tool. The basic premise behind it is hiding sensitive data in plain sight, within session cookies in web traffic, to evade detection by data loss prevention solutions. It consists of a two parts, a _feeder_ client run from within the target's network, and a _server_ for capturing the feeder's request and reassembling the data.

## Is this a hacking tool?

It can be used to transfer files, however it's a fairly immature, barebones implementation. In it's current form, it's better suited to testing the defensive controls than it is for an significant, malicious activity.
