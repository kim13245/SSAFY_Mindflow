import { Loader2 } from "lucide-react"

const ModelCard = ({ text, isUser, model, isLoading }) => {
  const getModelIcon = (modelName) => {
    return `/icons/${modelName}.svg`
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 model-card`}>
      <div className={` p-3 rounded-lg ${isUser ? "max-w-[70%] bg-[#e0e0e0] text-gray-800" : "w-[70%] text-gray-50"}`}>
        <div className="flex items-start gap-2 text-container">
          {!isUser && model && (
            <span className="flex-shrink-0 p-2 rounded-full w-10 h-10 bg-[#e0e0e0] mt-[-0.3em] mr-2">
              <img src={getModelIcon(model)} alt={`${model} icon`} className={"w-full h-full object-contain"} />
            </span>
          )}
          <p className="text-base leading-loose ">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModelCard
