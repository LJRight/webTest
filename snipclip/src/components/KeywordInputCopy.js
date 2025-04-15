// src/components/KeywordInput.js
import React, { useState } from "react";
import '../index.css';
import SubmitButton from "./SubmitButton";
import { FormContainer, InputField, KeywordInputForm, TextElement, DownloadButton } from "./Styles/Container/KeywordInput.style";
import ProgressBarComponent from "./ProgressBarComponent";
import axios from "axios";

const KeywordInput = () => {
  const [keyword, setKeyword] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  const fetchImageAsFile = async (url, index) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const ext = url.split('.').pop().split(/\#|\?/)[0];
    const filename = `image_${index}.${ext}`;
    return new File([blob], filename, { type: blob.type });
  };

  const handleSubmit = async (setLoading) => {
    if (keyword.trim() === "") {
      alert("키워드를 입력하세요!");
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setProgress(0);
    setProgressText("뉴스 스크랩 중...");
    setIsDownloadable(false);
    setVideoUrl(null);

    try {
      // 1. 뉴스 스크랩
      const scrapRes = await axios.post("/scrap", { query: keyword });
      setProgress(25);
      setProgressText("스크립트 생성 중...");

      // 2. 스크립트 생성
      const scriptRes = await axios.post("/script", {
        query: keyword,
        news: scrapRes.data.news,
      });
      setProgress(50);
      setProgressText("이미지 매칭 중...");

      // 3. 이미지 매칭
      const imageRes = await axios.post("/image", {
        query: keyword,
        script: scriptRes.data,
      });
      setProgress(75);
      setProgressText("비디오 생성 중...");

      // 4. 비디오 생성용 이미지/캡션 준비
      const formData = new FormData();
      const captions = [];

      for (let i = 0; i < imageRes.data.length; i++) {
        const sectionText = imageRes.data[i].section.join(" ");
        captions.push(sectionText);

        const imageUrl = imageRes.data[i].image[0];
        const imageFile = await fetchImageAsFile(imageUrl, i);
        formData.append("images", imageFile);
      }

      captions.forEach(caption => formData.append("captions", caption));

      const videoRes = await axios.post("/video", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setVideoUrl(videoRes.data.video_url);
      setProgress(100);
      setProgressText("완료되었습니다. 다운로드 가능!");
      
    } catch (error) {
      console.error("에러 발생:", error);
      setProgressText("에러가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsProcessing(false);
      setIsDownloadable(true);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = "video.mp4";
      link.click();
    }
  };

  return (
    <KeywordInputForm>
      <TextElement>최신 뉴스와 관련된 키워드를 입력하고, 요약 영상을 만들어보세요!</TextElement>
      <FormContainer>
        <InputField
          type="text"
          placeholder="키워드를 입력하세요"
          value={keyword}
          onChange={handleInputChange}
        />
        <SubmitButton onSubmit={handleSubmit} />
      </FormContainer>
      {isProcessing && (
        <>
          <ProgressBarComponent progress={progress} />
          <div style={{ marginTop: '10px', color: '#333' }}>{progressText}</div>
        </>
      )}
      {isDownloadable && videoUrl && (
        <DownloadButton onClick={handleDownload}>다운로드</DownloadButton>
      )}
    </KeywordInputForm>
  );
};

export default KeywordInput;
