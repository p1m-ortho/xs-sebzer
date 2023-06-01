# Credit: ChatGPT May 24 Version (https://help.openai.com/en/articles/6825453-chatgpt-release-notes). Free Research Preview.

# Initial prompt:
# i have a bibtex file, all elements of which contain the following part, in which %ID% is an integer id number i need to extract from this file: `url = {https://elibrary.ru/item.asp?id=%ID%}`. as a result, i want a newline-separated list of these id integers. write a python script. the script takes the input .bib file from command line argument and saves the resulting list as an .lst file with the same name as input and in the same dir.

# Final output, with modifications:

# Certainly! Here's a Python script that takes a Sebzer-generated BibTeX file as a command line argument, extracts the eLIBRARY.RU IDs from the URLs, and saves them in a newline-separated list in a file with the same name but a different extension:

import sys
import re

def extract_ids_from_bibtex(file_path):
    # Read a Sebzer-generated BibTeX file
    with open(file_path, 'r') as bib_file:
        bib_data = bib_file.read()

    # Extract the eLIBRARY.RU IDs using regular expressions
    pattern = r'url\s*=\s*{https://elibrary.ru/item.asp\?id=(\d+)}'
    ids = re.findall(pattern, bib_data)

    return ids

def save_ids_to_file(file_path, ids):
    # Create the output file path
    output_path = file_path.rsplit('.', 1)[0] + '.lst'

    # Save the eLIBRARY.RU IDs to the output file
    with open(output_path, 'w') as output_file:
        output_file.write('\n'.join(ids))

    print(f"eLIBRARY.RU IDs extracted successfully. Saved in '{output_path}'.")

if __name__ == '__main__':
    # Check if a file path is provided as a command line argument
    if len(sys.argv) != 2:
        print("Please provide a Sebzer-generated BibTeX file as a command line argument.")
        sys.exit(1)

    bib_file_path = sys.argv[1]

    # Extract the eLIBRARY.RU IDs from the Sebzer-generated BibTeX file
    ids = extract_ids_from_bibtex(bib_file_path)

    # Save the eLIBRARY.RU IDs to the output file
    save_ids_to_file(bib_file_path, ids)

# To use this script, run it from the command line, providing a Sebzer-generated BibTeX file, e.g., elibrary_ru.bib, as an argument:

# python sebzer-elid-parser.py elibrary_ru.bib

# This will extract the eLIBRARY IDs from the Sebzer-generated elibrary_ru.bib file and save them in a file named elibrary_ru.lst in the same directory. Make sure you have Python installed and the necessary dependencies (such as re) available.
