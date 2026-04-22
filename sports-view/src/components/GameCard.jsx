export default function GameCard({ status, homeTeam, awayTeam, homeScore, awayScore, time }) {
  return (
    <div className="w-[32%] bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] py-[14px] px-[20px] mb-[20px]">
      <h4 className="text-[#3b82f6] mb-[5px]">{time}</h4>
      <div className="flex justify-between border-b border-[rgba(255,255,255,0.07)] py-[10px]">
        <h3 className="font-bold">{homeTeam}</h3>
        <h3 className="font-bold">{homeScore ?? '—'}</h3>
      </div>
      <div className="flex justify-between py-[10px]">
        <h3 className="font-bold">{awayTeam}</h3>
        <h3 className="font-bold">{awayScore ?? '—'}</h3>
      </div>
    </div>
  )
}