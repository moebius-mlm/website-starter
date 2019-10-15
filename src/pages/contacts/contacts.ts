
import './contacts.scss';


const messageContainerElement = document.getElementById('message-container');

if (messageContainerElement) {
  const messageElement = document.createElement('p');
  messageElement.textContent = 'Feel free to get in touch with us!';
  messageContainerElement.appendChild(messageElement);
}
