import React, { useState } from "react"
import { Navigate } from "react-router-dom";

const LandingPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#353a3e] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <h2 className="text-center text-3xl font-extrabold text-white">랜딩페이지</h2>
                <a href="/login/" className="font-medium text-[#0eacf9] hover:text-gray-300">
                  로그인 하러 가기
                </a>
            </div>
        </div>
    )
}

export default LandingPage;