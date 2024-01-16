import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.tokenize import word_tokenize
from sklearn.metrics.pairwise import cosine_similarity
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
import pickle
import requests

class ContentBasedRecommender:
    def __init__(self, api_url='http://127.0.0.1:8082/get-all-active-course', content_col='deskripsi'):
        self.api_url = api_url
        self.content_col = content_col
        self.vectorizer = None
        self.bank = None
        self.df = None
        self.latest_data()

    def latest_data(self):
        response = requests.post(self.api_url)
        
        if response.status_code == 200:
            data = response.json()  
            self.df = pd.DataFrame(data)
        else:
            print(f"Error {response.status_code}: {response.text}")

    def fit(self):
        stopword_factory = StopWordRemoverFactory()
        stopwords = stopword_factory.get_stop_words()

        self.vectorizer = TfidfVectorizer(stop_words=stopwords)
        self.bank = self.vectorizer.fit_transform(self.df[self.content_col])

    def train(self):
        self.latest_data()
        self.fit()

    def recommend_course(self, id_course, min_similarity=0, topk=10):
        idx = self.df.index[self.df['id_course'] == id_course].tolist()

        if not idx:
            print(f"ID course {id_course} tidak ditemukan.")
            return []

        idx = idx[0]
        content = self.df.loc[idx, self.content_col]
        code = self.vectorizer.transform([content])

        cosine_sim = cosine_similarity(code, self.bank)
        rec_idx = cosine_sim.argsort()[0, ::-1][1:topk+1]

        filtered_rec_idx = [i for i in rec_idx if cosine_sim[0, i] > min_similarity]
        recommendations_df = self.df.loc[filtered_rec_idx].copy()

        recommendations_df['similarity'] = [cosine_sim[0, i] for i in filtered_rec_idx]
        recommendations = recommendations_df.to_dict(orient='records')

        return recommendations
    
    def recommend_minat(self, minat, min_similarity=0, topk=10):
        code = self.vectorizer.transform([minat])

        cosine_sim = cosine_similarity(interest_vector, self.bank)
        rec_idx = cosine_sim.argsort()[0, ::-1][1:topk+1]
        
        filtered_rec_idx = [idx for idx in rec_idx if cosine_sim[0, idx] > min_similarity]
        recommendations_df = self.df.loc[filtered_rec_idx].copy()

        recommendations_df['similarity'] = [cosine_sim[0, idx] for idx in filtered_rec_idx]
        recommendations = recommendations_df.to_dict(orient='records')

        return recommendations