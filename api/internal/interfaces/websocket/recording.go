package websocket

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/recording"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/recording"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	// 初始化recording handler
	recordingHandler, err := application.NewRecordingHandler(configs.GetConfig())
	if err != nil {
		log.Println("Error initializing recording handler:", err)
		return
	}

	for {
		var msg recording.Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("Error reading json.", err)
			break
		}

		switch msg.Type {
		case "start_recording":
			recordingHandler.StartRecording(conn, msg.Data)
		case "audio_data":
			recordingHandler.ProcessAudioData(conn, msg.Data)
		case "stop_recording":
			recordingHandler.StopRecording(conn, msg.Data)
		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}
