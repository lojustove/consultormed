let conversationHistory = [];
let lastScrollTop = 0;

document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.querySelector('.loading-screen');
    const appContainer = document.querySelector('.app-container');
    
    // Show loading screen for 5 seconds
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        appContainer.classList.add('visible');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 5000);

    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const header = document.querySelector('.header');

    // Simplificar el control de scroll para el header
    let isScrollingTimeout;
    chatContainer.addEventListener('scroll', function() {
        const scrollTop = chatContainer.scrollTop;
        const welcomeContainer = document.querySelector('.welcome-container');
        
        if (welcomeContainer) {
            const welcomeRect = welcomeContainer.getBoundingClientRect();
            const isNearWelcome = welcomeRect.top > -100 && welcomeRect.top < 200;
            
            if (isNearWelcome) {
                header.classList.remove('hidden');
                chatContainer.classList.remove('header-hidden');
            } else {
                header.classList.add('hidden');
                chatContainer.classList.add('header-hidden');
            }
        }
    });

    // Agregar sugerencias de consulta
    function addSuggestions() {
        const suggestions = [
            "¿Cómo aliviar el dolor de espalda?",
            "Remedios para el insomnio",
            "Consejos para la presión alta",
            "Alimentos saludables para diabéticos"
        ];

        const welcomeContainer = document.createElement('div');
        welcomeContainer.className = 'welcome-container';
        
        const welcomeTitle = document.createElement('div');
        welcomeTitle.className = 'welcome-title';
        welcomeTitle.textContent = '¡Bienvenido a ConsultorMed AI!';
        
        const welcomeText = document.createElement('div');
        welcomeText.className = 'welcome-text';
        welcomeText.textContent = 'Estamos aquí para ayudarte con tus consultas de salud. Puedes preguntarme sobre:';
        
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'suggestions';
        
        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.addEventListener('click', () => {
                userInput.value = suggestion;
                sendMessage();
            });
            suggestionsDiv.appendChild(chip);
        });

        welcomeContainer.appendChild(welcomeTitle);
        welcomeContainer.appendChild(welcomeText);
        welcomeContainer.appendChild(suggestionsDiv);
        chatContainer.appendChild(welcomeContainer);
    }

    // Función para añadir mensajes al chat
    function addMessage(message, isAI = false, imageUrl = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isAI ? 'ai-message' : 'user-message'}`;
        
        const textDiv = document.createElement('div');
        textDiv.textContent = message;
        messageDiv.appendChild(textDiv);
        
        if (isAI && imageUrl) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'message-image-container';
            
            const image = document.createElement('img');
            image.src = imageUrl;
            image.alt = 'Imagen médica relacionada';
            image.className = 'message-image';
            
            imageContainer.appendChild(image);
            messageDiv.appendChild(imageContainer);
        }
        
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        chatContainer.appendChild(messageDiv);
        
        messageDiv.offsetHeight;
        
        messageDiv.style.transition = 'all 0.3s ease-out';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Mostrar indicador de escritura
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typingIndicator';
        indicator.textContent = 'ConsultorMed está escribiendo...';
        chatContainer.appendChild(indicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Ocultar indicador de escritura
    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Función para enviar mensaje
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Añadir mensaje del usuario
        addMessage(message, false);
        userInput.value = '';

        // Añadir a la historia de la conversación
        conversationHistory.push({
            role: "user",
            content: message
        });

        // Mostrar indicador de escritura
        showTypingIndicator();

        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-sk-318da35cb25647b995bdf7d9c9d79f09'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un consultor médico experto. Da respuestas breves y precauciones. Nunca uses asteriscos. Usa viñetas o números para listas. Nunca des instrucciones directas - en su lugar, menciona lo que la gente suele hacer o lo que ha funcionado para otros ('Algunas personas suelen...', 'Tradicionalmente se ha usado...'). Si detectas algo grave, sugiere consultar a un médico inmediatamente. Máximo 2-3 oraciones por respuesta. Siempre termina con 'Consulte a un profesional de salud para un diagnóstico preciso'."
                        },
                        ...conversationHistory
                    ],
                    max_tokens: 100,
                    temperature: 0.7
                })
            });

            const data = await response.json();

            // Ocultar indicador de escritura
            hideTypingIndicator();

            if (data.choices && data.choices[0]) {
                const aiResponse = data.choices[0].message.content;
                
                // Buscar una imagen relevante basada en palabras clave de la respuesta
                try {
                    const keywords = extractKeywords(aiResponse);
                    const imageUrl = await getRelevantImage(keywords);
                    addMessage(aiResponse, true, imageUrl);
                } catch (error) {
                    addMessage(aiResponse, true);
                    console.error('Error getting image:', error);
                }

                // Añadir a la historia de la conversación
                conversationHistory.push({
                    role: "assistant",
                    content: aiResponse
                });

                // Mantener solo las últimas 10 mensajes
                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(-10);
                }
            } else {
                throw new Error('Respuesta inválida del API');
            }

        } catch (error) {
            hideTypingIndicator();
            addMessage("Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.", true);
            console.error('Error:', error);
        }
    }

    // Función para extraer palabras clave del texto
    function extractKeywords(text) {
        // Lista de palabras médicas comunes en español para ignorar
        const commonWords = ['dolor', 'síntomas', 'tratamiento', 'medicina', 'salud'];
        
        // Limpiar y dividir el texto
        const words = text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .split(/\s+/);
        
        // Encontrar palabras relevantes
        const relevantWords = words.filter(word => 
            word.length > 3 && 
            !commonWords.includes(word)
        );
        
        // Identificar términos médicos específicos
        const medicalTerms = words.filter(word => 
            word.includes('itis') || 
            word.includes('emia') || 
            word.includes('algia')
        );
        
        return [...new Set([...medicalTerms, ...relevantWords.slice(0, 2)])].join(' ') + ' medical';
    }

    // Función para obtener una imagen relevante
    async function getRelevantImage(keywords) {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&client_id=MhowRKJfrYdtFrjtcwYapJ7Arg_gxGW76MfcVq2KYNQ`);
        const data = await response.json();
        return data.urls.small;
    }

    userInput.addEventListener('focus', function() {
        // Small delay to ensure the keyboard is fully shown
        setTimeout(() => {
            userInput.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    });

    // Prevent elastic scrolling on iOS
    document.body.addEventListener('touchmove', function(e) {
        if (e.target === document.body) {
            e.preventDefault();
        }
    }, { passive: false });

    // Improve touch response
    if ('ontouchstart' in window) {
        const touchElements = document.querySelectorAll('.suggestion-chip, #sendButton');
        touchElements.forEach(elem => {
            elem.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            });
            elem.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
        });
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Mensaje inicial más amigable
    setTimeout(() => {
        addSuggestions();
        addMessage("¡Hola! Soy tu asistente médico virtual. Estoy aquí para brindarte información sobre temas de salud y sugerir remedios naturales que han funcionado para otras personas. ¿En qué puedo ayudarte hoy?", true);
    }, 1000);
});
