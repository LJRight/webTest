// src/components/KeywordInput.js
import React, { useState } from "react";
import '../index.css';
import SubmitButton from "./SubmitButton";
import { FormContainer, InputField, KeywordInputForm, TextElement, DownloadButton } from "./Styles/Container/KeywordInput.style";
import ProgressBarComponent from "./ProgressBarComponent";
import axios from "axios";
import VideoSourceManager from "./VideoSourceManager";
import realData from '../mock/realResult.json';
import aiData from '../mock/aiResult.json';

const KeywordInput = () => {
  const [keyword, setKeyword] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const [selectedImageType, setSelectedImageType] = useState();
  const [scriptText, setScriptText] = useState("리액트");



  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  // image url to File form
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
      console.log("[1/4] 뉴스 스크랩 요청 중...");
      const scrapRes = await axios.post("/scrap", { query: keyword }, { timeout: 900000 });
      setProgress(25);
      console.log("뉴스 스크랩 완료");
      setProgressText("스크립트 생성 중...");

      // 2. 스크립트 생성
      console.log("[2/4] 스크립트 생성 요청 중...");
      const scriptRes = await axios.post("/script", {
        query: keyword,
        news: scrapRes.data.news,
      }, { timeout: 900000 });
      setProgress(50);
      console.log("스크립트 생성 완료");
      setProgressText("이미지 매칭 중...");

      // 3. 이미지 매칭(일단 POST로 호출 이후 job id 를 받아와서 주기적으로 GET으로 상태 확인)
      console.log("[3/4] 이미지 매칭 요청 중...");

      const startTimeReal = Date.now();
      const startTimeAI = Date.now();

      const readlImageJob = await axios.post("/image_real", {
        query: keyword,
        script: scriptRes.data,
      });
      const aiImageJob = await axios.post("/image_ai", {
        query: keyword,
        script: scriptRes.data,
      });

      const jobId_ai = aiImageJob.data.job_id;
      const jobId_real = readlImageJob.data.job_id;

      const startTime = Date.now();

      // let stopTimer = false;

      // 1초마다 진행 시간 텍스트 업데이트
      // const timerInterval = setInterval(() => {
      //   const now = Date.now();
      //   const elapsed = Math.floor((now - startTime) / 1000);
      //   const minutes = Math.floor(elapsed / 60);
      //   const seconds = elapsed % 60;
      //   setProgressText(`이미지 매칭 중... (작업 대기 ${minutes}분 ${seconds}초)`);
      //   if (stopTimer) clearInterval(timerInterval);
      // }, 1000);

      // // 10초마다 상태 확인
      // let status = "PENDING";
      // let imageResult = null;
      // while (status !== "SUCCESS") {
      //   const statusRes = await axios.get(`/status/${jobId_real}`);
      //   status = statusRes.data.status;

      //   if (status === "FAILURE") {
      //     stopTimer = true;
      //     throw new Error("Image generation failed");
      //   }

      //   if (status === "SUCCESS") {
      //     const resultRes = await axios.get(`/result/${jobId_real}`);
      //     imageResult = resultRes.data.result;
      //     stopTimer = true;
      //     break;
      //   }

      //   await new Promise(resolve => setTimeout(resolve, 10000));  // 10초 대기
      // }

      ///////////////////////////////////

      let realResult = null;
      let aiResult = null;
      let realDone = false;
      let aiDone = false;

      let stopTimer = false;

      const timerInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setProgressText(`이미지 매칭 중... (작업 대기 ${minutes}분 ${seconds}초)`);
        if (stopTimer) clearInterval(timerInterval);
      }, 1000);

      // 동시에 상태 확인
      while (!realDone || !aiDone) {
        if (!realDone) {
          const statusRes = await axios.get(`/status/${jobId_real}`);
          if (statusRes.data.status === "FAILURE") {
            throw new Error("실제 이미지 매칭 실패");
          } else if (statusRes.data.status === "SUCCESS") {
            const resultRes = await axios.get(`/result/${jobId_real}`);
            realResult = resultRes.data.result;
            realDone = true;

            const elapsed = ((Date.now() - startTimeReal) / 1000).toFixed(2);
            console.log(`실제 이미지 매칭 완료 (${elapsed}초)`);
            console.log(realResult);
          }
        }

        if (!aiDone) {
          const statusRes = await axios.get(`/status/${jobId_ai}`);
          if (statusRes.data.status === "FAILURE") {
            throw new Error("AI 이미지 생성 실패");
          } else if (statusRes.data.status === "SUCCESS") {
            const resultRes = await axios.get(`/result/${jobId_ai}`);
            aiResult = resultRes.data.result;
            aiDone = true;

            const elapsed = ((Date.now() - startTimeAI) / 1000).toFixed(2);
            console.log(`AI 이미지 생성 완료 (${elapsed}초)`);
            console.log(aiResult);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
      }

      console.log("=== 이미지 매칭 완료 ===");
      console.log("실제 이미지 결과:", realResult);
      console.log("AI 이미지 결과:", aiResult);

      setProgress(75);
      console.log("이미지 매칭 완료");
      setProgressText("비디오 생성 중...");

      // 임시 코드 (첫 번째 카테고리만 선택)
      const firstCategory = realResult[0];

      // 4. 비디오 생성용 이미지/캡션 준비
      const formData = new FormData();
      const captions = [];

      // for (let i = 0; i < imageResult.length; i++) {
      //   const sectionText = imageResult[i].section.join(" ");
      //   captions.push(sectionText);

      //   const imageUrl = imageResult[i].image[0];
      //   const imageFile = await fetchImageAsFile(imageUrl, i);
      //   formData.append("images", imageFile);
      // }
      for (let i = 0; i < firstCategory.image.length; i++) {
        const sectionText = `${firstCategory.section[i * 2]} ${firstCategory.section[i * 2 + 1]}`;
        captions.push(sectionText);

        const imageUrl = firstCategory.image[i][0];
        const imageFile = await fetchImageAsFile(imageUrl, i);
        formData.append("images", imageFile);
      }
      captions.forEach(caption => formData.append("captions", caption));

      console.log("[4/4] 비디오 생성 요청 중...");
      const videoRes = await axios.post("/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 900000
      });

      setVideoUrl(videoRes.data.video_url);
      setProgress(100);
      console.log("비디오 생성 완료");
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
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const safeKeyword = keyword.replace(/[^가-힣a-zA-Z0-9]/g, "_"); // 특수문자 제거
      const filename = `${timestamp}_${safeKeyword}.mp4`;
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = filename;
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
          disabled={isProcessing}
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


      {/* <SectionFormatter
        scriptValue={scriptText}
        onScriptChange={setScriptText}
        imageType={selectedImageType}
        onImageTypeChange={(e) => setSelectedImageType(e.target.value)}
        realImageUrl="/example.jpeg"
        aiImageUrl="/example.jpeg"
      /> */}

      <VideoSourceManager
        realResult={realData[0]}
        aiResult={aiData[0]} />
    </KeywordInputForm>

  );
};

export default KeywordInput;
