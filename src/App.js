import React, { useState } from 'react';
import './App.css';
import { useEffect } from 'react';
import axios from 'axios';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.csrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const client = axios.create({
  baseURL: "https://d198bemxyz9el2.cloudfront.net"
});

function App() {

  const [currentUser, setCurrentUser] = useState();
  const [registrationToggle, setRegistrationToggle] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [documentId, setDocumentId] = useState(null); // New state for document_id
  const [isPDFUploaded, setIsPDFUploaded] = useState(false);

  useEffect(() => {
    client.get("/api/user")
    .then(function(res) {
      setCurrentUser(true);
    })
    .catch(function(error) {
      setCurrentUser(false);
    });
  }, []);

  function updateFormbtn() {
    setRegistrationToggle(prevToggle => !prevToggle);
  }

  function update_form_btn() {
    if (registrationToggle) {
      document.getElementById("form_btn").innerHTML = "Register";
      setRegistrationToggle(false);
    } else {
      document.getElementById("form_btn").innerHTML = "Log in";
      setRegistrationToggle(true);
    }
  }
  // Function to get CSRF token from cookies
function getCookie(name) {
  const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return cookieValue ? cookieValue.pop() : '';
}

  function submitRegistration(e) {
    e.preventDefault();
    client.post(
      "/api/register",
      {
        email: email,
        username: username,
        password: password
      }
    ).then(function(res) {
      client.post(
        "/api/login",
        {
          email: email,
          password: password
        }
      ).then(function(res) {
        setCurrentUser(true);
      });
    });
  }

  function submitLogin(e) {
    e.preventDefault();
    client.post(
      "/api/login",
      {
        email: email,
        password: password
      }
    ).then(function(res) {
      setCurrentUser(true);
    });
  }

  function submitLogout(e) {
    e.preventDefault();
    client.post(
      "/api/logout",
      {withCredentials: true}
    ).then(function(res) {
      setCurrentUser(false);
    });
  }

  function handleFileChange(e) {
    setSelectedFile(e.target.files[0]);
  }

  function handleFileUpload(e) {
    e.preventDefault();
    const formData = new FormData();
    const csrftoken = getCookie('csrftoken');

    formData.append('document', selectedFile);

    client.post(
      "/api/pdfupload/",
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': csrftoken  // Include CSRF token in the headers
        },
        withCredentials: true
      }
    ).then(function(res) {
      console.log(res.data.document_id)
      setDocumentId(res.data.document_id);
      setIsPDFUploaded(true); // Set isPDFUploaded to true after successful upload

      console.log("PDF file uploaded successfully!");
    }).catch(function(error) {
      console.error("Error uploading PDF file:", error);
    });
  }

    // Functions to handle chat
    function sendMessage() {
      if (userInput.trim() === '') return;
      
      const message = {
        sender: 'user',
        content: userInput.trim()
      };
  
      setChatMessages(prevMessages => [...prevMessages, message]);
      setUserInput('');
      const csrftoken = getCookie('csrftoken');
 
      // Send message to chatbot API
      client.post("/api/chatbot/", { message: userInput.trim(),  
          document_id: documentId // Include the document_id in the request body

        },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRFToken': csrftoken  // Include CSRF token in the headers
          },
          withCredentials: true
        })
        .then(response => {
          const botMessage = {
            sender: 'bot',
            content: response.data.response
          };
          setChatMessages(prevMessages => [...prevMessages, botMessage]);
        })
        .catch(error => console.error("Error sending message to chatbot:", error));
    }
  
    return (
      <div>
        {/* Navbar */}
        {currentUser ? (
          <Navbar bg="dark" variant="dark">
            <Container>
              <Navbar.Brand>TaxGPT App</Navbar.Brand>
              <Navbar.Toggle />
              <Navbar.Collapse className="justify-content-end">
                <Navbar.Text>
                  <form onSubmit={e => submitLogout(e)}>
                    <Button type="submit" variant="light">Log out</Button>
                  </form>
                </Navbar.Text>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        ) : (
          <Navbar bg="dark" variant="dark">
            <Container>
              <Navbar.Brand>TaxGPT App</Navbar.Brand>
              <Navbar.Toggle />
              <Navbar.Collapse className="justify-content-end">
                <Navbar.Text>
                  <Button id="form_btn" onClick={update_form_btn} variant="light">Register</Button>
                </Navbar.Text>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        )}
    
        {/* Main content */}
        {currentUser ? (
          <div>
            {/* Upload PDF form */}
            <div>
              <h4>Upload PDF File</h4>
              <input type="file" accept=".pdf" onChange={handleFileChange} />
              <button onClick={handleFileUpload}>Upload</button>
            </div>
    
            {/* Chat interface */}
            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.map((message, index) => (
                  <div key={index} className={`message ${message.sender}`}>
                    {message.content}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          </div>
        ) : (
          // Authentication form for non-authenticated user
          <div className="center">
            {registrationToggle ? (
              <Form onSubmit={e => submitRegistration(e)}>
                {/* Registration form */}
                <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} />
              <Form.Text className="text-muted">
                We'll never share your email with anyone else.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
              </Form>
            ) : (
              <Form onSubmit={e => submitLogin(e)}>
                {/* Login form */}
                <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} />
              <Form.Text className="text-muted">
                We'll never share your email with anyone else.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
              </Form>
            )}
          </div>
        )}
      </div>
    );
    







  
}

export default App;
