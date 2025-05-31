let conversationHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

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
    function addMessage(message, isAI = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isAI ? 'ai-message' : 'user-message'}`;
        messageDiv.textContent = message;
        
        // Añadir animación de entrada suave
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        chatContainer.appendChild(messageDiv);
        
        // Forzar el reflow
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
                    'Authorization': 'Bearer sk-a8f655a3b223489cb20403ec4b5559d6'
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
                // Añadir respuesta de la IA
                const aiResponse = data.choices[0].message.content;
                addMessage(aiResponse, true);

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
