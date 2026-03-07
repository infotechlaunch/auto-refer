import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
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
    
    // Add user message to UI
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
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col mb-4"
              style={{ height: '500px', maxHeight: '80vh' }}
            >
              {/* Header */}
              <div className="p-4 bg-teal-600 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <h3 className="font-semibold">ITL AutoRefer Assistant</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-teal-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-teal-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.role === 'model' && (
                        <div className="flex items-center space-x-1 mb-1 text-teal-600 dark:text-teal-400">
                          <Bot className="w-3 h-3" />
                          <span className="text-xs font-semibold">Assistant</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.parts[0].text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm rounded-bl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <form
                  onSubmit={handleSend}
                  className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 rounded-full pr-1 pl-4 py-1"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 dark:text-white dark:placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 sm:p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 text-white rounded-full transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 sm:w-4 sm:h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-4 rounded-full shadow-2xl transition-colors ${
            isOpen ? 'bg-slate-800 hover:bg-slate-900' : 'bg-teal-600 hover:bg-teal-700'
          } text-white flex items-center justify-center`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 border border-white"></span>
              </span>
            </>
          )}
        </motion.button>
      </div>
    </>
  );
}
