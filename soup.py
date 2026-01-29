#source: @jonesetc.com ty king you're an icon
from bs4 import BeautifulSoup
import os
import csv
import sys

# TO DO
# 1. soup the toc title text to be accurate
# 2. maybe figure out the href title text for external hrefs?
# 3. add alt text to images???
# 4. fix "refer to caption" localization!!!

# MUST ADD FOR NEW LANGS
lang_flags = {'en': '🇺🇸 English', 'de': '🇩🇪 Deutsch', 'fr': '🇫🇷 Français'}

#
# begin parsing file
#

# check if a code is used
if len(sys.argv) < 2: 
    print("MISSING LANGUAGE CODE. Usage: python soup.py <language code>") 
    sys.exit(1) 

# check if too many codes are used for some reason
if len(sys.argv) > 2: 
    print("TOO MANY LANGUAGE CODES. Usage: python soup.py <language code>") 
    sys.exit(1) 

# build spice cabinet to make soup for each language
# file path relative to main. example: trans/de/spices_de.csv
language = sys.argv[1]
spice_name = "spices_" + language + ".csv"
cabinet_file = os.path.join("trans",language,spice_name)
print("Language used: ",language)

# choose file for language
# en carve out for mandatory index.html and no subdomain
if language == "en":
    html_loc_name = "index.html"
    og_url_tag = "https://pghrt.diy"
else:
    html_loc_name = language + ".html"
    og_url_tag = "https://" + language + ".pghrt.diy"
html_file = os.path.join("export",html_loc_name)

if not os.path.isfile(html_file):
    print("ERROR:",html_file,"DOES NOT EXIST. Is your language code wrong or did you not build the HTML?")
    sys.exit(1)

if not os.path.isfile(cabinet_file):
    print("ERROR:",cabinet_file,"DOES NOT EXIST. Is your language code wrong or do you not have your spices?")
    sys.exit(1)

#
# begin making soup
#

# seasonings for soup. it's a chinese 5 spice blend [read: html loc. also there are five entries in the localization file]
with open(cabinet_file, encoding='utf-8') as csvfile:
    cabinet = list(csv.reader(csvfile, delimiter='|'))[0]

# Parse the file into soup
with open(html_file, 'r', encoding='utf-8') as fin:
    soup = BeautifulSoup(fin, 'html.parser')

#
# rearrange html structure
#

# Create menu button, header, and nest
menu = soup.new_tag(
    'button',
    id='menu',
    onclick='document.getElementById(\'sidebar\').classList.toggle(\'show\')',
    string='☰',
)
header = soup.new_tag('div', **{'class':'header'})
header.append(menu)

# Create toggle buttons, header, and nest
toggles = soup.new_tag('div', **{'class':'togglebuttons'})
menu = soup.new_tag(
    'button',
    id='theme-toggle',
    string='☀',
)
toggles.append(menu)
menu = soup.new_tag(
    'button',
    id='font-toggle',
    string='Aa',
)
toggles.append(menu)

# Extract table of contents navigation
toc = soup.body.find('div', class_='ltx_page_main').nav.extract()

# need id to grab to make the menu button work
toc['id'] = 'sidebar'

# correcting a bug in latexml that drops em dash prefixes on toc in html output
toc_emdashes = toc.select('a[href*="SSx"] > span')
for line in toc_emdashes:
    line.string.insert_before('—')

# adding a toast
# localization position 0: "Link Copied!"
toast = soup.new_tag (
    "div",
    id="snackbar",
    string=cabinet[0]
)

# add return to ref button
# localization position 1: "Return to previous position"
ref = soup.new_tag (
    "div",
    id="return",
    title=cabinet[1]
)

# prepend body with buttons and rearranged table of contents
soup.body.insert(0, toast, ref, toggles, header, toc)

#
# add html header info
#

# meta: (property, content)
# localization position 2: "A Practical Guide To Feminizing HRT"
# localization position 3: "The futile attempt yadda yadda"
meta_headers = [
    ('og:title', cabinet[2]),
    ('og:type', 'website'),
    ('og:url', og_url_tag),
    ('og:image', 'https://pghrt.diy/img/cover.png'),
    ('og:description', cabinet[3])
]

# links: (rel, type, href)
link_headers = [
    ('icon', 'image/png', 'https://pghrt.diy/img/favicon.png'),
    ('stylesheet', 'text/css', 'https://pghrt.diy/pghrtcss.css')
]

for attribs in meta_headers:
    head_meta = soup.new_tag(
    'meta',
    property=attribs[0],
    content=attribs[1],
    )
    soup.head.extend([head_meta,"\n"])

for attribs in link_headers:
    head_meta = soup.new_tag(
    'link',
    rel=attribs[0],
    type=attribs[1],
    href=attribs[2],
    )
    soup.head.extend([head_meta,"\n"])

head_meta = soup.new_tag(
    'script',
    type='text/javascript',
    src='https://pghrt.diy/pghrtjs.js',
    defer='true'
)
soup.head.extend([head_meta,"\n"])

#
# content manipulation and adjustment
#

# find all the section and question headers then add a click to copy icon
# localization position 4: "Click to copy"
for element in soup.find_all(["h2", "h3"]):
    #find the id of its section
    hash = element.parent['id']

    new_chain = soup.new_tag(
        'a',
        **{'class':'chain'},
        href="#" + hash,
        title=cabinet[4],
        onclick="copyURI(event)",
        string=' 🔗',
    )
    element.append(new_chain)

# changing pdf link
# hosted on github because that keeps the site lighter under cloudflare's 25mb limit
soup.find(href="PDF_LINK")['href'] = "https://raw.githubusercontent.com/Juicysteak117/pghrt/refs/heads/main/pdfs/pghrt_" + language + ".pdf"

# appending asset links to source of images for the html
# can't get latexml to play nice with graphicspath so this is easier
for element in soup.select('figure > img'):
    old_string = element['src']
    element['src'] = 'https://pghrt.diy/img/' + old_string

# hardcoding the other asset links so it plays nice with the subdomain
soup.find(href="LaTeXML.css")['href'] = "https://pghrt.diy/LaTeXML.css"
soup.find(href="ltx-article.css")['href'] = "https://pghrt.diy/ltx-article.css"

# insert language flag links
lang_links = soup.find('p', string="LANGUAGE-CODE-DOT-PGHRT-DOT-DIY")
lang_links.clear()
first_flag = True
for lc, flag in lang_flags.items():
    url = "https://" + lc + ".pghrt.diy"
    new_flag = soup.new_tag(
        'a',
        **{'class':'ltx_ref ltx_href'},
        href=url,
        title=flag,
        string=flag,
    )
    if not first_flag:
        lang_links.append(', ')
    first_flag = False
    lang_links.append(new_flag)

# adding an 88x31 button because omg isn't she so cute!???
# what a great suggestion. ty acrylic!!!
# made using: https://hekate2.github.io/buttonmaker/
cute = soup.new_tag(
    'img',
    id='cute',
    src="https://pghrt.diy/img/pghrt_88x31.png"
)
soup.find('section',id="Sx1").insert(0,cute)

# replacing \DTMNow with the footer timestamp because there aren't latexml
# bindings for the datetime2 package and i want it to look prettier
# i also remove the double space because it REALLY annoys me. i already sent
# in an issue about it though. eventually i can remove that line lol
# i realize this doesn't localize but truly do i care???? no. come on now.
dtm = soup.body.find('span', class_='ltx_ERROR undefined')
dtm['class'] = 'undefined'
timestamp = soup.footer.div.contents[0]
postmarked = timestamp.text.replace("Generated  on ", "Generated on ")
timestamp.replace_with(postmarked)
dtm.string = postmarked.replace("Generated on ", "").replace(" by ", "")

#
# garnish and serve
#

# i'm at soup
print("soup made for language: ",language)

# Write the updated soup back out to the file
with open(html_file, 'w', encoding='utf-8') as fout:
    fout.write(str(soup))