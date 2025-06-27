This is a demo for an interview app that uses LLM to evaluate candidates' interview answers.
### Installation
Follow this step to install requirements
This demo was tested on Windows 10 with python3.10
```Shell
#Clone this repo
git clone https://github.com/Rykkura/LLM_interview.git

#Create and active a virtual environment
python -m venv .venv
cd .venv\Scripts
activate

#Install requirements
pip install -r requirements.txt
cd interview_app
npm install
```
### Demo
You will need: 
  - 'openai api key' to use whisper model
  - 'gemini api key' to use gemini model
you can easily get gemini api key for free in google ai studio
unfortunately you need to pay some money to get a openai key but not too much
After you get all the key assign them to variable in line 108 and line 134 in api.py file
Now you can run the app and enjoy it:
```shell
#api
fastapi dev api.py
#webapp
npm start
```
