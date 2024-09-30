"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import styles from "./page.module.css"

export default function Home() {
  const [aiResponse, setAiResponse] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isThinking, setIsThinking] = useState(false)
  const fileInputRef = useRef(null)
  const [avgResponseTime, setAvgResponseTime] = useState(22)
  const [progress, setProgress] = useState(0)

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setAiResponse(null)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1] // Base64 encoding
        setIsThinking(true)
        setAiResponse(null)
        setCapturedImage(null)

        try {
          const response = await fetch("http://mac:8000/process_image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Image }), // Sending base64 image
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          setAiResponse(data.response)
          setCapturedImage(data.image)
          setAvgResponseTime(data.avg_response_time)
        } catch (error) {
          console.error("Error processing image:", error)
          setAiResponse(`Error: Failed to process the image. ${error.message}`)
        } finally {
          setIsThinking(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    fetch("http://mac:8000/get_response_time")
      .then((response) => response.json())
      .then((data) => setAvgResponseTime(data.avg_response_time))
  }, [])

  const renderAIResponse = (response) => {
    if (!response) return null

    try {
      const parsedResponse = JSON.parse(response)
      return (
        <div className={styles.responseContainer}>
          <h2>{parsedResponse.name}</h2>
          <p>{parsedResponse.description}</p>
          <ul className={styles.statsGrid}>
            <li>
              <strong>Type</strong> {parsedResponse.type.join(", ")}
            </li>
            <li>
              <strong>Weight</strong> {parsedResponse.weight} kg
            </li>
            <li>
              <strong>Height</strong> {parsedResponse.height} m
            </li>
            <li>
              <strong>HP</strong> {parsedResponse.hp}
            </li>
            <li>
              <strong>Attack</strong> {parsedResponse.attack}
            </li>
            <li>
              <strong>Defense</strong> {parsedResponse.defense}
            </li>
            <li>
              <strong>Special Attack</strong> {parsedResponse.special_attack}
            </li>
            <li>
              <strong>Special Defense</strong> {parsedResponse.special_defense}
            </li>
            <li>
              <strong>Speed</strong> {parsedResponse.speed}
            </li>
            <li>
              <strong>Abilities</strong>
              <ul className={styles.abilitiesList}>
                {parsedResponse.abilities.map((ability, index) => (
                  <li key={index}>{ability}</li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      )
    } catch (error) {
      console.error("Error parsing AI response:", error)
      return <p>Error parsing AI response</p>
    }
  }

  useEffect(() => {
    let intervalId
    if (isThinking) {
      const estimatedResponseTime = avgResponseTime * 1000 || 22000 // Default to 22 seconds if no average available

      intervalId = setInterval(() => {
        setProgress((oldProgress) => {
          const newProgress = oldProgress + 100 / (estimatedResponseTime / 100)
          return newProgress > 100 ? 100 : newProgress
        })
      }, 100)
    } else {
      setProgress(0)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isThinking, avgResponseTime])

  return (
    <div className={styles.pokemonPage}>
      <main className={styles.pokemonMain}>
        <h1 className={styles.pokemonTitle}>Pokét Encyclopedia</h1>
        <div className={styles.pokemonControls}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <button
            className={styles.pokeball}
            onClick={() => fileInputRef.current.click()}
            disabled={isThinking}
          >
            Capture
          </button>
        </div>
        {isThinking && (
          <>
            <p className={styles.thinking}>Professor Oats is thinking...</p>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </>
        )}

        {capturedImage && (
          <div className={styles.pokemonImageContainer}>
            <Image
              src={`data:image/jpeg;base64,${capturedImage}`}
              alt="Captured Pokémon"
              width={200}
              height={150}
              layout="responsive"
            />
          </div>
        )}
        {aiResponse && renderAIResponse(aiResponse)}
        {avgResponseTime !== null && (
          <p className={styles.responseTime}>
            Pokét Encyclopedia response time: {avgResponseTime.toFixed(2)}{" "}
            seconds
          </p>
        )}
        <p className={styles.programmedBy}>Programmed by: Adam</p>
      </main>
    </div>
  )
}
