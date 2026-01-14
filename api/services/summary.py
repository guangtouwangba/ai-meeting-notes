from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

def generate_summary(text: str, api_key: str, model: str = "google/gemini-pro-1.5"):
    if not api_key:
        raise ValueError("API Key is required")

    llm = ChatOpenAI(
        openai_api_key=api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        model_name=model,
        temperature=0.7
    )

    template = """
    You are a professional meeting assistant.
    Here is the transcript of a meeting:
    {transcript}

    Please summarize the meeting content structure as follows:
    1. One-sentence summary
    2. Key Topics (Bullet points)
    3. Action Items (Who needs to do what)
    4. Detailed Notes
    """

    prompt = PromptTemplate(template=template, input_variables=["transcript"])
    chain = LLMChain(llm=llm, prompt=prompt)

    return chain.run(transcript=text)
