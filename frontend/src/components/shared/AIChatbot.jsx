import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { chatApi } from '../../lib/api';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: 'Hello! I am ITL AutoRefer Assistant. How can I help you today?' }] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', parts: [{ text: userMessageText }] }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { text, success, message } = await chatApi.send(newMessages);
      if (success) {
        setMessages([...newMessages, { role: 'model', parts: [{ text }] }]);
      } else {
        setMessages([...newMessages, { role: 'model', parts: [{ text: message || 'Something went wrong.' }] }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'model', parts: [{ text: 'Sorry, I encountered an error connecting to the server.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .itl-chatbot-root {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .itl-chatbot-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 380px;
          max-width: calc(100vw - 48px);
          height: 550px;
          max-height: calc(100vh - 120px);
          background-color: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1);
        }
        [data-theme="dark"] .itl-chatbot-window {
          background-color: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .itl-chatbot-header {
          padding: 16px 20px;
          background: linear-gradient(135deg, #0d9488, #0891b2) !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white !important;
        }
        .itl-chatbot-content {
          flex: 1;
          overflow-y: auto;
          background-color: #f8fafc;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        [data-theme="dark"] .itl-chatbot-content {
          background-color: #1e293b;
        }
        .itl-chatbot-bubble {
          max-width: 85%;
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.5;
        }
        .itl-chatbot-bubble-assistant {
          align-self: flex-start;
          background-color: #ffffff !important;
          color: #1e293b !important;
          border-radius: 16px 16px 16px 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        [data-theme="dark"] .itl-chatbot-bubble-assistant {
          background-color: #334155 !important;
          color: #f1f5f9 !important;
          border-color: #475569;
        }
        .itl-chatbot-bubble-user {
          align-self: flex-end;
          background: linear-gradient(135deg, #0d9488, #0891b2) !important;
          color: white !important;
          border-radius: 16px 16px 4px 16px;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
        }
        .itl-chatbot-input-area {
          padding: 14px 16px;
          background-color: #ffffff;
          border-top: 1px solid #e2e8f0;
        }
        [data-theme="dark"] .itl-chatbot-input-area {
          background-color: #0f172a;
          border-color: #1e293b;
        }
        .itl-chatbot-form {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #f1f5f9;
          padding: 6px 6px 6px 18px;
          border-radius: 25px;
        }
        [data-theme="dark"] .itl-chatbot-form {
          background-color: #1e293b;
        }
        .itl-chatbot-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: inherit;
          padding: 8px 0;
        }
        .itl-chatbot-submit {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #0d9488 !important;
          color: white !important;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .itl-chatbot-trigger {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #0d9488;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(13, 148, 136, 0.4);
          position: relative;
        }
        .itl-chatbot-trigger.open {
          background-color: #1e293b;
        }
        .itl-chatbot-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .itl-chatbot-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .itl-chatbot-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        [data-theme="dark"] .itl-chatbot-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
        }
      ` }} />

      <div className="itl-chatbot-root">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="itl-chatbot-window"
            >
              <div className="itl-chatbot-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bot size={22} />
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>ITL AutoRefer Assistant</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
                >
                  <X size={22} />
                </button>
              </div>

              <div className="itl-chatbot-content itl-chatbot-scrollbar">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`itl-chatbot-bubble ${
                      msg.role === 'user' ? 'itl-chatbot-bubble-user' : 'itl-chatbot-bubble-assistant'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontSize: '10px', color: '#0d9488', fontWeight: 800 }}>
                        <Bot size={11} />
                        <span>ASSISTANT</span>
                      </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.parts[0].text}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="itl-chatbot-bubble itl-chatbot-bubble-assistant" style={{ padding: '8px 12px' }}>
                    <Loader2 size={16} className="animate-spin" style={{ color: '#0d9488' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="itl-chatbot-input-area">
                <form onSubmit={handleSend} className="itl-chatbot-form">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="itl-chatbot-input"
                  />
                  <button type="submit" disabled={!input.trim() || isLoading} className="itl-chatbot-submit">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`itl-chatbot-trigger ${isOpen ? 'open' : ''}`}
        >
          {isOpen ? <X size={28} /> : (
            <>
              <MessageSquare size={28} />
              <span style={{
                position: 'absolute', top: -1, right: -1,
                width: 12, height: 12, borderRadius: '50%',
                backgroundColor: '#10b981', border: '2px solid white'
              }} />
            </>
          )}
        </button>
      </div>
    </>
  );
}
