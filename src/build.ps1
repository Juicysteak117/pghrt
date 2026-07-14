# make pdf, clean mess, make html, transform html
# repeats for each language

# TODO: add auto-change for windows/linux?
# discards the obnoxious latexmlc log file output
# please note that /nul is windows specific; /dev/null for linux
$trash = "/nul"
# $trash = "/dev/null"

# currently supported languages; source of truth BUT soup.py will need the flags!
# english (en), german (de), 
$languages = @("en", "de", "fr")
$output = $languages -join ", "

# temp bug workaround
$null = Read-Host "vsc bug; skip"

Write-Host "Currently supported languages: $output"
$lc = Read-Host "Please input the desired language code, or press ENTER to build all"

function New-Language-Build ([string]$lc, [string] $trash) {
    # probaly easier to do this ONE english exceptionalism this way instead
    if ("en" -ieq $lc) {$html = "index"} else {$html = $lc}
    latexmk -pdf -outdir=pdfs -silent trans/$lc/pghrt_$lc;
    latexmk -c -outdir=pdfs -silent trans/$lc/pghrt_$lc;
    latexmlc --destination=export/$html.html --log=$trash trans/$lc/pghrt_$lc;
    python soup.py $lc;
}

# check if you input a single language right
if ($languages -contains $lc) {
    New-Language-Build $lc $trash
}
else {
    # all languages
    foreach ($lc in $languages) {
        New-Language-Build $lc $trash
    }
}

