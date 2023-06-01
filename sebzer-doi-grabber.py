# Credit: ChatGPT May 24 Version (https://help.openai.com/en/articles/6825453-chatgpt-release-notes). Free Research Preview.

# Initial prompt:
# i have a list of ids that are integers. they fit to this url format: https://elibrary.ru/item.asp?id={id}. i need you to write a python script that iterates through this list of ids (read from newline-separated text file taken as a script argument), then uses beautifulsoup to retrieve innerhtml of the page and then parse it and retrieve a doi from that page. Dois on these urls are contained within this kind of element: `<td width="53%" align="right">DOI:&nbsp;<font color="#00008f"><a href="https://doi.org/{DOI}" target="_blank" rel="nofollow">{DOI}</a></font></td>`, which is unique on the page.

# Final output, with modifications:

# Certainly! I can help you with that. Here's a Python script that accomplishes the task you described using BeautifulSoup:

import sys
import csv
import os
import requests
from bs4 import BeautifulSoup

def get_doi_from_id(id):
    url = f"https://elibrary.ru/item.asp?id={id}"

    # Send a GET request to the eLIBRARY.RU URL
    response = requests.get(url)
    if response.status_code == 200:
        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find the DOI element
        doi_element = soup.find('td', text=lambda t: t and t.startswith('DOI:&nbsp;'))
        if doi_element:
            # Extract the DOI value
            doi = doi_element.find_next('font').find_next('a').text
            print(f"DOI found for eLIBRARY.RU ID {id}: {doi}")
            return doi
        else:
            print(f"No DOI found for eLIBRARY.RU ID {id}")
    else:
        print(f"Failed to retrieve URL for eLIBRARY.RU ID {id}")

# Read the input file from command line argument, e.g., an elibrary_ru.lst file that sebzer-elid-parser.py produces
if len(sys.argv) < 2:
    print("Please provide the input file as a command line argument. If you used sebzer-elid-parser.py to parse a Sebzer-generated BibTeX file, this would usually be elibrary_ru.lst.")
    sys.exit(1)

filename = sys.argv[1]
output_filename = os.path.splitext(filename)[0] + '.csv'  # Generate output file name

with open(filename, 'r') as file:
    ids = file.read().splitlines()

results = []
# Iterate through the eLIBRARY.RU IDs and get the DOIs
for id in ids:
    doi = get_doi_from_id(id)
    results.append([id, doi])

# Save the results to a CSV file
with open(output_filename, 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['elibrary_id', 'doi'])  # Write header row
    writer.writerows(results)

print(f"Results saved to {output_filename}")

# To use this script, make sure you have the requests and beautifulsoup4 libraries installed. You can install them using pip install requests beautifulsoup4. Save the script in a Python file (e.g., retrieve_doi.py), and create a text file (elibrary_ru.lst) with the newline-separated list of IDs you want to process, e.g., using a Sebzer-generated BibTeX file and the sebzer-elid-parser.py script.

# Run the script with the following command:

# python sebzer-doi-grabber.py elibrary_ru.lst

# The script will iterate through the eLIBRARY.RU IDs, retrieve the HTML content from each URL, find the DOI element using BeautifulSoup, and extract the DOI value. It will then print the DOI for each eLIBRARY.RU ID, or a message if no DOI is found.

# Please note that this script assumes that the HTML structure of the page you mentioned remains the same. If there are any changes, the script may need modifications accordingly.
