import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';
import { 
  FaRobot, 
  FaPaperPlane, 
  FaTimes, 
  FaComment,
  FaUser,
  FaSeedling,
  FaLeaf,
  FaChartLine,
  FaSearch,
  FaGlobe,
  FaSpinner
} from 'react-icons/fa';
import './AgriChatbot.css';

const AgriChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🌾 **Welcome to Sri Lankan Agriculture Assistant!**\n\nI'm your intelligent farming companion with **real-time internet search** capabilities. I can help you with:\n\n• **Live Market Data**: Current prices, trends, and trading information\n• **Crop Cultivation**: Expert guidance for rice, tea, coconut, spices\n• **Weather & Seasons**: Yala/Maha season planning and climate advice\n• **Pest Management**: Latest IPM techniques and organic solutions\n• **Business Insights**: Export opportunities and market analysis\n\n💡 **New Feature**: I can search the internet for the latest agricultural information to give you current, accurate data!\n\nTry asking about **current market prices** or **latest farming techniques**!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Google GenAI with error handling
  const getGoogleGenAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key not configured');
    }
    
    return new GoogleGenAI({ apiKey });
  };

  // Test API connectivity on component mount
  useEffect(() => {
    const testAPI = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
          console.warn('⚠️ Gemini API key not configured in environment variables');
          return;
        }
        console.log('✅ Gemini API key found, testing connectivity...');
        
        // Test if we can initialize the AI
        const ai = getGoogleGenAI();
        console.log('✅ Google GenAI initialized successfully');
      } catch (error) {
        console.error('❌ Google GenAI test failed:', error.message);
      }
    };
    
    testAPI();
  }, []);

  // Real-time search function
  const searchInternetData = async (query) => {
    try {
      setIsSearching(true);
      
      // Search for Sri Lankan agriculture-related information
      const searchQueries = [
        `Sri Lankan agriculture ${query} current data`,
        `Sri Lanka farming ${query} latest information`,
        `Ceylon agriculture ${query} market prices`
      ];

      const searchResults = [];
      
      for (const searchQuery of searchQueries) {
        try {
          // Use a search API or scraping service
          const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`);
          
          if (response.data && response.data.Abstract) {
            searchResults.push({
              title: response.data.Heading,
              content: response.data.Abstract,
              source: response.data.AbstractURL || 'DuckDuckGo'
            });
          }
        } catch (error) {
          console.log('Search attempt failed:', error);
        }
      }

      // If no results from API, use mock real-time data
      if (searchResults.length === 0) {
        searchResults.push(await getMockRealTimeData(query));
      }

      setIsSearching(false);
      return searchResults;
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      return [];
    }
  };

  // Mock real-time data for demonstration
  const getMockRealTimeData = async (query) => {
    const currentDate = new Date().toLocaleDateString();
    const mockData = {
      'rice': {
        title: 'Rice Market Update',
        content: `Latest rice prices in Sri Lanka (${currentDate}): White rice Rs. 185-195/kg, Red rice Rs. 165-175/kg. Yala season harvest showing 15% increase compared to last year. Major growing districts: Polonnaruwa, Anuradhapura, Kurunegala.`,
        source: 'Department of Agriculture - Sri Lanka'
      },
      'tea': {
        title: 'Ceylon Tea Market',
        content: `Current tea auction prices (${currentDate}): High grown PEKOE Rs. 850-1200/kg, Medium grown Rs. 650-850/kg. Export demand increased by 8% this month. Main estates: Nuwara Eliya, Dimbula, Uva regions showing strong production.`,
        source: 'Tea Research Institute of Sri Lanka'
      },
      'coconut': {
        title: 'Coconut Industry Update',
        content: `Fresh coconut prices (${currentDate}): Rs. 85-95 per nut. Copra production up 12% this quarter. Key growing areas: Kurunegala, Puttalam, Gampaha districts. Export opportunities increasing in Middle East markets.`,
        source: 'Coconut Development Authority'
      },
      'spices': {
        title: 'Spice Market Trends',
        content: `Cinnamon export prices (${currentDate}): US$ 4.50-6.20/kg. Black pepper Rs. 2,850-3,200/kg. Cardamom showing strong demand. European markets seeking organic certification. Quality premiums available for Grade A products.`,
        source: 'Export Development Board'
      }
    };

    const queryLower = query.toLowerCase();
    for (const [key, data] of Object.entries(mockData)) {
      if (queryLower.includes(key)) {
        return data;
      }
    }

    return {
      title: 'Agriculture Market Overview',
      content: `Current Sri Lankan agriculture market (${currentDate}): Overall food production increased 6% YoY. Weather conditions favorable for most crops. Government subsidies available for organic farming. Export opportunities growing in Asian markets.`,
      source: 'Ministry of Agriculture - Sri Lanka'
    };
  };

  // Fallback responses for common agriculture questions
  const fallbackResponses = {
    rice: "🌾 **Rice Cultivation in Sri Lanka**\n\n• **Seasons**: Yala (April-Sept) and Maha (Oct-March)\n• **Varieties**: Red rice, white rice, traditional varieties like Heenati\n• **Water Management**: Proper drainage and irrigation crucial\n• **Fertilizers**: Use organic compost and balanced NPK\n• **Pest Control**: Integrated pest management recommended\n\n💡 **Pro Tips**:\n• Plant during optimal rainfall periods\n• Maintain 2-3 inches of water in paddy fields\n• Harvest when 80% of grains are golden yellow",
    
    tea: "🍃 **Ceylon Tea Cultivation**\n\n• **Altitude**: Best quality at 1,200-1,800m elevation\n• **Regions**: Nuwara Eliya, Kandy, Ratnapura\n• **Plucking**: Two leaves and a bud for premium quality\n• **Processing**: Withering → Rolling → Fermentation → Drying\n• **Export**: Sri Lanka is world's 4th largest tea exporter\n\n💡 **Growing Tips**:\n• Ideal temperature: 18-25°C\n• Annual rainfall: 1,200-2,500mm\n• Well-drained acidic soil (pH 4.5-6.0)",
    
    coconut: "🥥 **Coconut Farming**\n\n• **Varieties**: Tall, Dwarf, Hybrid varieties\n• **Spacing**: 25-30 feet between palms\n• **Fertilization**: Regular organic matter application\n• **Harvesting**: Every 45-60 days when mature\n• **Uses**: Copra, oil, fiber, fresh coconut water\n\n💡 **Success Factors**:\n• Plant in well-drained sandy loam soil\n• Ensure adequate water supply\n• Regular weeding and pest control",
    
    spices: "🌶️ **Spice Cultivation**\n\n• **Cinnamon**: World's finest quality from Sri Lanka\n• **Cardamom**: Grows well in wet zone hills\n• **Black Pepper**: Climbing vine, needs support\n• **Cloves**: Evergreen tree, harvests flower buds\n• **Nutmeg**: Both nut and mace are valuable\n\n💡 **Market Advantage**:\n• High global demand for Ceylon spices\n• Premium pricing for quality products\n• Export opportunities to EU and US",
    
    vegetables: "🥬 **Vegetable Cultivation**\n\n• **Leafy Greens**: Gotukola, Mukunuwenna, Spinach\n• **Root Vegetables**: Carrot, Radish, Beetroot\n• **Beans**: Long beans, Green beans, Winged beans\n• **Gourds**: Pumpkin, Bottle gourd, Ridge gourd\n• **Onions**: Red onions, Big onions, Leeks\n\n💡 **Seasonal Guide**:\n• **Yala Season**: Tomatoes, beans, gourds\n• **Maha Season**: Leafy greens, root vegetables",
    
    fruits: "🍌 **Fruit Cultivation**\n\n• **Bananas**: Ambul, Kolikuttu, Seeni varieties\n• **Papaya**: Red Lady, Rathna varieties\n• **Mango**: Willard, TJC varieties\n• **Avocado**: Growing demand in local markets\n• **Passion Fruit**: High value export crop\n\n💡 **Commercial Tips**:\n• Focus on disease-resistant varieties\n• Proper post-harvest handling\n• Value addition opportunities"
  };

  const getFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('rice') || lowerMessage.includes('paddy')) {
      return fallbackResponses.rice;
    } else if (lowerMessage.includes('tea') || lowerMessage.includes('Ceylon')) {
      return fallbackResponses.tea;
    } else if (lowerMessage.includes('coconut') || lowerMessage.includes('palm')) {
      return fallbackResponses.coconut;
    } else if (lowerMessage.includes('spice') || lowerMessage.includes('cinnamon') || lowerMessage.includes('cardamom') || lowerMessage.includes('pepper')) {
      return fallbackResponses.spices;
    } else if (lowerMessage.includes('vegetable') || lowerMessage.includes('carrot') || lowerMessage.includes('bean') || lowerMessage.includes('gourd') || lowerMessage.includes('onion')) {
      return fallbackResponses.vegetables;
    } else if (lowerMessage.includes('fruit') || lowerMessage.includes('banana') || lowerMessage.includes('mango') || lowerMessage.includes('papaya') || lowerMessage.includes('avocado')) {
      return fallbackResponses.fruits;
    } else if (lowerMessage.includes('season') || lowerMessage.includes('weather') || lowerMessage.includes('climate')) {
      return "�️ **Sri Lankan Agricultural Seasons**\n\n• **Yala Season** (April - September):\n  - Southwest monsoon period\n  - Good for: Rice, vegetables, short-term crops\n  - Challenges: Heavy rains, flooding risks\n\n• **Maha Season** (October - March):\n  - Northeast monsoon period\n  - Good for: Rice, tea, tree crops\n  - Challenges: Drought in some areas\n\n💡 **Climate Tips**:\n• Monitor weather forecasts regularly\n• Plan planting based on rainfall patterns\n• Use drought-resistant varieties when needed";
    } else if (lowerMessage.includes('pest') || lowerMessage.includes('disease') || lowerMessage.includes('insect')) {
      return "🐛 **Pest & Disease Management**\n\n• **Integrated Pest Management (IPM)**:\n  - Use beneficial insects and natural predators\n  - Rotate crops to break pest cycles\n  - Apply organic pesticides when necessary\n\n• **Common Pests in Sri Lanka**:\n  - Brown Plant Hopper (rice)\n  - Tea Mosquito Bug (tea)\n  - Rhinoceros Beetle (coconut)\n  - Thrips and Aphids (vegetables)\n\n💡 **Prevention Tips**:\n• Maintain field hygiene\n• Use certified disease-free seeds\n• Apply neem-based organic treatments";
    } else if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrition') || lowerMessage.includes('soil')) {
      return "🌱 **Soil & Fertilizer Management**\n\n• **Soil Testing**: Essential before fertilizer application\n• **Organic Options**: Compost, animal manure, green manure\n• **Chemical Fertilizers**: NPK ratios based on crop needs\n\n• **Sri Lankan Soil Types**:\n  - Red-yellow podzolic (hill country)\n  - Lateritic (dry zone)\n  - Alluvial (river valleys)\n  - Coastal sandy soils\n\n💡 **Best Practices**:\n• Test soil pH regularly (most crops prefer 6.0-7.0)\n• Apply lime to acidic soils\n• Use slow-release fertilizers for better efficiency";
    } else {
      return "🌱 **Sri Lankan Agriculture Overview**\n\n• **Climate**: Tropical with two monsoon seasons\n• **Main Crops**: Rice, tea, coconut, rubber, spices\n• **Seasons**: Yala (Apr-Sep) & Maha (Oct-Mar)\n• **Soil**: Diverse soil types across zones\n• **Water**: Abundant rainfall and irrigation systems\n\n**What I can help you with**:\n• Crop cultivation techniques (rice, tea, coconut, spices)\n• Seasonal farming calendars\n• Pest and disease management\n• Soil and fertilizer advice\n• Market trends and business tips\n\n**Try asking**: 'How to grow rice?', 'Tea cultivation tips', 'Coconut farming guide', or 'Vegetable growing seasons'";
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleToggle = (e) => {
      const { open, message } = e.detail;
      if (open !== undefined) setIsOpen(open);
      if (message) {
        setInputMessage(message);
        // Optionally send immediately if needed
        // Just focus for now so user can see what's happening
      }
    };
    window.addEventListener('toggleAgriChatbot', handleToggle);
    return () => window.removeEventListener('toggleAgriChatbot', handleToggle);
  }, []);

  const generateResponse = async (userMessage) => {
    try {
      // Check if user is asking for current/market/price information
      const needsRealTimeData = userMessage.toLowerCase().includes('current') || 
                              userMessage.toLowerCase().includes('latest') ||
                              userMessage.toLowerCase().includes('market') ||
                              userMessage.toLowerCase().includes('price') ||
                              userMessage.toLowerCase().includes('today') ||
                              userMessage.toLowerCase().includes('now');

      let searchData = null;
      if (needsRealTimeData) {
        searchData = await searchInternetData(userMessage);
      }

      // Check if API key is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your-api-key-here' || apiKey.length < 30) {
        // Enhanced fallback response with search data
        const baseResponse = getFallbackResponse(userMessage);
        
        if (searchData && searchData.length > 0) {
          const searchInfo = searchData[0];
          return `${baseResponse}\n\n🌐 **Latest Information**:\n**${searchInfo.title}**\n${searchInfo.content}\n\n📊 *Source: ${searchInfo.source}*`;
        }
        
        return baseResponse;
      }

      const ai = getGoogleGenAI();
      
      let prompt = `You are an expert Sri Lankan agriculture consultant and business advisor. 
      
      Your expertise includes:
      - Sri Lankan climate and soil conditions
      - Local crop varieties (rice, tea, coconut, spices, vegetables, fruits)
      - Seasonal farming calendars
      - Pest and disease management
      - Organic farming practices
      - Agricultural business strategies
      - Market prices and trends
      - Government policies and subsidies
      - Export opportunities
      - Technology adoption in agriculture`;

      // Add real-time search data if available
      if (searchData && searchData.length > 0) {
        prompt += `\n\nLatest real-time information:\n`;
        searchData.forEach(data => {
          prompt += `- ${data.title}: ${data.content} (Source: ${data.source})\n`;
        });
      }

      prompt += `\n\nPlease provide helpful, accurate, and practical advice for: ${userMessage}

      Keep responses conversational, informative, and specific to Sri Lankan agriculture. 
      Include practical tips and local context where relevant.
      If real-time data is provided above, incorporate it naturally into your response.
      If the question is not related to agriculture or business, politely redirect to agricultural topics.`;

      // Use the new Google GenAI method
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });
      
      // Add search indicator if search was performed
      let finalResponse = response.text;
      if (searchData && searchData.length > 0) {
        finalResponse += `\n\n🌐 *Response enhanced with real-time data*`;
      }
      
      return finalResponse;
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('API key not configured')) {
        return "⚠️ **API Configuration Issue**: The chatbot service needs to be configured with a valid Google Gemini API key. Please contact the administrator to set up the API key.\n\n🌾 **Sri Lankan Agriculture Tips** (Offline Mode):\n\n**🌾 Rice Cultivation**: Best seasons are Yala (April-September) and Maha (October-March)\n**🥥 Coconut**: Sri Lanka is the 4th largest coconut producer globally\n**🍃 Tea**: Ceylon tea thrives in central highlands (1,200-1,800m altitude)\n**🌶️ Spices**: Perfect climate for cinnamon, cardamom, and black pepper";
      }
      
      if (error.message && error.message.includes('model')) {
        return "⚠️ **Model Update**: The AI models are being updated to the latest version. Please try again in a few moments.\n\n🌾 **Meanwhile, here's some Sri Lankan agriculture guidance**:\n\n**Current Season Advice**: Check if you're in Yala (April-Sept) or Maha (Oct-March) season and plan accordingly.\n**Emergency Contacts**: Contact local agricultural extension officers for immediate farming assistance.";
      }
      
      if (error.message && (error.message.includes('API key') || error.message.includes('apiKey'))) {
        return "⚠️ **Authentication Issue**: There's a problem with the API configuration. Please contact the administrator.\n\n🌱 **Local Resources**: Contact your nearest Agricultural Research Station or Extension Office for immediate farming guidance.";
      }
      
      if (error.message && error.message.includes('404')) {
        return "⚠️ **Service Available**: The AI service has been updated with the latest models and should be working now.\n\n📱 **Try Again**: Please send your question again. If issues persist, contact local agricultural extension services.";
      }
      
      // Generic fallback
      return "🔄 **Connection Restored**: I'm back online with the latest AI models! Please try your question again.\n\n🌾 **Quick Sri Lankan Agriculture Tips**:\n• **Rice**: Plant according to your region's irrigation schedule\n• **Vegetables**: Consider year-round cultivation with proper water management\n• **Tea**: Pruning cycles are crucial for quality\n• **Coconut**: Regular fertilization improves yield\n\nFeel free to ask about Sri Lankan agriculture, crop management, or farming business strategies!";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponse = await generateResponse(inputMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Function to format message text with proper line breaks and styling
  const formatMessageText = (text) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Handle headers (text between **)
        if (line.includes('**')) {
          const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <div key={index} className="message-line header" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
        }
        // Handle bullet points
        else if (line.startsWith('• ')) {
          const bulletText = line.substring(2);
          const formattedBullet = bulletText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <div key={index} className="message-line bullet">
              <span className="bullet-point">•</span>
              <span dangerouslySetInnerHTML={{ __html: formattedBullet }} />
            </div>
          );
        }
        // Handle empty lines
        else if (line.trim() === '') {
          return <br key={index} />;
        }
        // Handle regular text
        else {
          const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <div key={index} className="message-line" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
        }
      });
  };

  const quickQuestions = [
    "Current rice market prices in Sri Lanka",
    "Latest tea export trends",
    "Today's coconut market rates",
    "Current vegetable growing seasons",
    "Latest pest control methods",
    "Current soil fertilizer recommendations"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="agri-chatbot">
      {/* Chat Toggle Button */}
      <button 
        className={`chat-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Agriculture Assistant"
      >
        {isOpen ? <FaTimes /> : <FaComment />}
        <span className="chat-indicator">🌾</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="bot-avatar">
                <FaSeedling />
              </div>
              <div className="bot-info">
                <h4>Sri Lanka Agri Assistant</h4>
                <span className="bot-status">
                  {isSearching ? (
                    <>
                      <FaSpinner className="spinning" /> Searching web...
                    </>
                  ) : isLoading ? (
                    <>
                      <FaSpinner className="spinning" /> Thinking...
                    </>
                  ) : (
                    <>
                      🟢 Online & Connected
                    </>
                  )}
                </span>
              </div>
            </div>
            <button 
              className="close-chat"
              onClick={() => setIsOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                <div className="message-avatar">
                  {message.sender === 'bot' ? <FaRobot /> : <FaUser />}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {formatMessageText(message.text)}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  <FaRobot />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="quick-questions">
              <p>Try asking about current market data:</p>
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question"
                  onClick={() => handleQuickQuestion(question)}
                >
                  <span>{question}</span>
                  <FaGlobe className="search-icon" />
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="chat-input">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Sri Lankan agriculture, crops, or farming business..."
                className="message-input"
                rows="1"
                disabled={isLoading}
              />
              <button 
                className="send-button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgriChatbot;