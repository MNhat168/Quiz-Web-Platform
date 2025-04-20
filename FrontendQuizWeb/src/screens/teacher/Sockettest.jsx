import React, { useState } from 'react';
import SockJS from 'sockjs-client';

const SimpleSocketTest = () => {
    const [status, setStatus] = useState('Not connected');
    const [log, setLog] = useState([]);

    const addLog = (msg) => {
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };


    const testConnect = () => {
        addLog('Attempting connection...');
        setStatus('Connecting...');

        // First test if basic SockJS info endpoint works
        fetch('http://localhost:8080/ws-sessions/info')
            .then(res => res.json())
            .then(data => {
                addLog(`Info endpoint success: ${JSON.stringify(data)}`);

                const token = localStorage.getItem('token');

                // Create SockJS with headers
                const sock = new SockJS('http://localhost:8080/ws-sessions', null, {
                    transports: 'websocket',
                    headers: {
                        Authorization: `Bearer ${token}` // Add JWT to headers
                    }
                });
                sock.onmessage = (e) => {
                    addLog(`Message: ${e.data}`);
                };

                sock.onclose = (e) => {
                    addLog(`Socket closed: ${e.code} - ${e.reason}`);
                    setStatus('Closed');
                };

                sock.onerror = (e) => {
                    addLog(`Error: ${e}`);
                    setStatus('Error');
                };
            })
            .catch(err => {
                addLog(`Info endpoint error: ${err.message}`);
                setStatus('Info Endpoint Failed');
            });
    };

    return (
        <div>
            <h2>Simple SockJS Test</h2>
            <p>Status: <strong>{status}</strong></p>
            <button onClick={testConnect}>Test Connection</button>
            <div style={{ margin: '20px 0' }}>
                <h3>Log:</h3>
                <pre style={{ height: '200px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                    {log.join('\n')}
                </pre>
            </div>
        </div>
    );
};

export default SimpleSocketTest;