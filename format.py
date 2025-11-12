with open('temp.sql', 'r') as f:
    content = f.read()

content = content.replace('), (', '),\n    (')
content = content.replace('VALUES (', 'VALUES\n    (')

with open('temp.sql', 'w') as f:
    f.write(content)
