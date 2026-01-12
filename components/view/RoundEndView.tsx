export default function RoundEndView() {
    return (
        <div class="quiz-view-gradient bg-gradient-to-r from-warning to-error text-warning-content">
            <div class="quiz-icon">⏱️</div>
            <p class="text-2xl font-bold">Time's Up!</p>
            <p class="text-lg mt-2 opacity-80">Calculating results...</p>
            <span class="loading loading-dots loading-lg mt-4"></span>
        </div>
    );
}