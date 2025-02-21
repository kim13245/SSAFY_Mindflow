const ModelCard = ({ text, isUser, model }) => {
  const getModelIcon = (modelName) => {
    return `/icons/${modelName}.svg`
  }
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={` p-3 rounded-lg ${isUser ? "max-w-[70%] bg-[#e0e0e0] text-gray-800" : "w-[70%] bg-[#e0e0e0] text-gray-800"}`}>
        <div className="flex items-center gap-2">
          {!isUser && model && (
            <span className="flex-shrink-0 w-5 h-5">
              <img src={getModelIcon(model)} alt={`${model} icon`} className="w-full h-full object-contain" />
            </span>
          )}
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </div>
  )
}

export default ModelCard
