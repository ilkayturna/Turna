# SMS Endpoint Test Script
$PHONE = "5343622375"
$RESULTS = @()

$ENDPOINTS = @(
    @{ id="onur_market"; name="Onur Market"; url="https://www.onurmarket.com/api/v1/auth/register/sendOtp"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" },
           @{ payload='{"phone":"+905343622375"}'; ct="application/json"; desc="phone:+905XX" },
           @{ payload='{"phone":"05343622375"}'; ct="application/json"; desc="phone:05XX" },
           @{ payload='{"mobilePhone":"5343622375"}'; ct="application/json"; desc="mobilePhone" },
           @{ payload='{"phoneNumber":"5343622375"}'; ct="application/json"; desc="phoneNumber" }
       )},
    @{ id="sportive"; name="Sportive"; url="https://www.sportive.com.tr/api/v1/auth/register/send-otp"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" },
           @{ payload='{"phoneNumber":"5343622375"}'; ct="application/json"; desc="phoneNumber" }
       )},
    @{ id="shopandfly"; name="Shop&Fly"; url="https://www.shopandfly.com.tr/api/v1/otp/send"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" },
           @{ payload='{"phone":"+905343622375"}'; ct="application/json"; desc="phone:+905XX" }
       )},
    @{ id="teb"; name="TEB"; url="https://www.teb.com.tr/api/v1/otp/send"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" }
       )},
    @{ id="bkm_express"; name="BKM Express"; url="https://www.bkmexpress.com.tr/api/v1/otp/send"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" }
       )},
    @{ id="kfc"; name="KFC"; url="https://www.kfc.com.tr/api/v1/auth/register/send-otp"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" }
       )},
    @{ id="lr"; name="LR"; url="https://neo.lrworld.com/api/v1/login/cas"; method="POST";
       tests=@(
           @{ payload='{"phone":"+905343622375","country":"TR"}'; ct="application/json"; desc="phone:+905XX+country" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" }
       )},
    @{ id="massimo_dutti"; name="Massimo Dutti"; url="https://www.massimodutti.com/tr/api/auth/register/sendOtp"; method="POST";
       tests=@(
           @{ payload='{"phone":"+905343622375"}'; ct="application/json"; desc="phone:+905XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" },
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" }
       )},
    @{ id="e_bebek"; name="E-bebek"; url="https://www.e-bebek.com/api/v1/auth/register/send-otp"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" },
           @{ payload='{"phone":"5343622375","email":"test@test.com"}'; ct="application/json"; desc="phone+email" }
       )},
    @{ id="lcwaikiki"; name="LC Waikiki"; url="https://www.lcwaikiki.com.tr/api/v1/auth/register/send-otp"; method="POST";
       tests=@(
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" },
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" }
       )},
    @{ id="oldubil"; name="Oldubil"; url="https://api.oldubil.com/api/v1/auth/send-otp"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" }
       )},
    @{ id="happy_center"; name="Happy Center"; url="https://www.happycenter.com.tr/api/v1/auth/register/sendOtp"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" }
       )},
    @{ id="komagene"; name="Komagene"; url="https://gateway.komagene.com.tr/auth/auth/smskodugonder"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" },
           @{ payload='{"gsm":"5343622375"}'; ct="application/json"; desc="gsm" }
       )},
    @{ id="hayat_su"; name="Hayat Su"; url="https://api.hayatsu.com.tr/api/SignUp/SendOtp"; method="POST";
       tests=@(
           @{ payload='{"phone":"5343622375"}'; ct="application/json"; desc="phone:5XX" },
           @{ payload='{"phone":"905343622375"}'; ct="application/json"; desc="phone:905XX" }
       )}
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SMS ENDPOINT TEST - Starting" -ForegroundColor Cyan
Write-Host "Phone: $PHONE" -ForegroundColor Yellow
Write-Host "Endpoints to test: $($ENDPOINTS.Count)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

foreach ($ep in $ENDPOINTS) {
    Write-Host "`n--- Testing: $($ep.name) ---" -ForegroundColor Green
    Write-Host "URL: $($ep.url)" -ForegroundColor Gray
    
    foreach ($t in $ep.tests) {
        Write-Host "  Test: $($t.desc)" -ForegroundColor White
        
        $headers = @{
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            "Accept" = "application/json, text/plain, */*"
            "Accept-Language" = "tr-TR,tr;q=0.9"
            "Content-Type" = $t.ct
            "Cache-Control" = "no-cache"
            "Origin" = $ep.url -replace '/api.*', ''
            "Referer" = ($ep.url -replace '/api.*', '') + '/'
        }
        
        try {
            $resp = Invoke-WebRequest -Uri $ep.url -Method $ep.method -Headers $headers -Body $t.payload -UseBasicParsing -TimeoutSec 15
            $body = $resp.Content
            $code = $resp.StatusCode
            
            $reason = ""
            $success = $false
            
            if ($body -match '"status":\s*false') { $reason = "FALSE:status=false" }
            elseif ($body -match '"IsSuccessful":\s*false') { $reason = "FALSE:IsSuccessful=false" }
            elseif ($body -match '"smsRequired":\s*false') { $reason = "FALSE:smsRequired=false" }
            elseif ($body -match '"smsrequired":\s*false') { $reason = "FALSE:smsrequired=false" }
            elseif ($body -match 'otomatik erisim') { $reason = "FALSE:bot_detection" }
            elseif ($body -match 'surum gerekli') { $reason = "FALSE:new_version" }
            elseif ($body -match '"responseType":\s*"SUCCESS"') { $success=$true; $reason = "TRUE:responseType" }
            elseif ($body -match 'SMS.*gonderildi') { $success=$true; $reason = "TRUE:SMS_sent" }
            elseif ($body -match 'SMS.*gönderildi') { $success=$true; $reason = "TRUE:SMS_sent" }
            elseif ($body -match 'claimId') { $success=$true; $reason = "TRUE:claimId" }
            elseif ($body -eq '' -or $body -eq '{}') { $reason = "EMPTY" }
            else { $reason = "OTHER" }
            
            $RESULTS += @{ id=$ep.id; name=$ep.name; test=$t.desc; status=$code; body=$body.Substring(0, [Math]::Min(200, $body.Length)); success=$success; reason=$reason }
            
            $color = if ($success) { "Green" } elseif ($reason -match "FALSE") { "Red" } elseif ($reason -eq "EMPTY") { "Yellow" } else { "Gray" }
            Write-Host "    Status: $code | $reason" -ForegroundColor $color
            if ($body.Length -gt 0) { Write-Host "    Body: $($body.Substring(0, [Math]::Min(150, $body.Length)))" -ForegroundColor Gray }
            
        } catch {
            $RESULTS += @{ id=$ep.id; name=$ep.name; test=$t.desc; status="ERROR"; body=$_.Exception.Message; success=$false; reason="ERROR" }
            Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 500
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$trueResults = $RESULTS | Where-Object { $_.success -eq $true }
$falseResults = $RESULTS | Where-Object { $_.reason -match "FALSE" }
$emptyResults = $RESULTS | Where-Object { $_.reason -eq "EMPTY" }

Write-Host "`nGENUINE SUCCESS:" -ForegroundColor Green
if ($trueResults) { foreach ($r in $trueResults) { Write-Host "  OK: $($r.name) - $($r.test) - Status: $($r.status)" -ForegroundColor Green } }
else { Write-Host "  None" -ForegroundColor Yellow }

Write-Host "`nFALSE POSITIVES:" -ForegroundColor Red
if ($falseResults) { foreach ($r in $falseResults) { Write-Host "  FAIL: $($r.name) - $($r.test) - $($r.reason)" -ForegroundColor Red } }
else { Write-Host "  None" -ForegroundColor Yellow }

Write-Host "`nEMPTY RESPONSE:" -ForegroundColor Yellow
if ($emptyResults) { foreach ($r in $emptyResults) { Write-Host "  UNKNOWN: $($r.name) - $($r.test) - Status: $($r.status)" -ForegroundColor Yellow } }
else { Write-Host "  None" -ForegroundColor Yellow }

$RESULTS | ConvertTo-Json -Depth 5 | Out-File "curl-test-results.json" -Encoding UTF8
Write-Host "`nResults saved to curl-test-results.json" -ForegroundColor Cyan
