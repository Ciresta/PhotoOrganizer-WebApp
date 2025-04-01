import requests

ACCESS_TOKEN = "EAAZAK4IutaYIBO7tjPoODpUNJ8we6oShmIPCrd0eK7i4kVC1CajnzYMZA5PVZBSSap3qjS7N6GHyzYmkWySXjZCz9IzP2BnWLiN04fEZCHWC7zjbMOVamtBTn9KhS1mC3yy8ryoeOslgC2mreZCi12Kk2y6DmZCjHZBTBK934uwWZBKZBpGBHzL8gb6Qt2ikZAq5B4PDLeNS1heTaGKLn5GnjyxUL89FMCqpY1wIhAZD"
PHONE_NUMBER_ID = "615816394943729"  # From Meta Developer Console
TO_PHONE_NUMBER = "+918431940349"  # Must start with country code (e.g., +1234567890)

url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

data = {
    "messaging_product": "whatsapp",
    "to": TO_PHONE_NUMBER,
    "type": "text",
    "text": {"body": "Hello! This is an automated message from my WhatsApp bot! 🎉"}
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
