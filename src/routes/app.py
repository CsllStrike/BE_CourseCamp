from flask import Flask, request, jsonify
from recommendation_sys import ContentBasedRecommender
import sys

app = Flask(__name__)

port = int(sys.argv[1])
host = sys.argv[2]

recommender = ContentBasedRecommender()
recommender.fit()

@app.route('/recommend-course', methods=['POST'])
def recommend_course():
    data = request.json
    id_course = data.get('id_course')

    if id_course is None:
        return jsonify({'error': 'Field "id_course" is required'}), 400

    try:
        id_course = int(id_course)
    except ValueError:
        return jsonify({'error': 'Invalid value for "id_course". Must be an integer'}), 400

    recommendations = recommender.recommend_course(id_course)
    
    return jsonify({'result': recommendations})

@app.route('/recommend-minat', methods=['POST'])
def recommend_minat():
    data = request.json
    minat = data.get('minat')

    recommendations = recommender.recommend_minat(minat)
    
    return jsonify({'result': recommendations})

@app.route('/train', methods=['POST'])
def train_model():
    recommender.train()
    return jsonify({'message': 'Model trained successfully'})

if __name__ == '__main__':
    app.run(port=port, host=host)