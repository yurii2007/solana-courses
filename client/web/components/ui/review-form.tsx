import { FC, FormEvent, useState } from 'react';
import { Movie } from '@/models/movie-model';
import { StarIcon } from '@heroicons/react/24/solid';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

const MOVIE_REVIEW_PROGRAM_ID = 'CenYq6bDRB7p73EjsPEpiYN7uveyPUTdXkDkgUduboaN';

export const Form: FC = () => {
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const movie = new Movie(title, rating, description);
    handleTransactionSubmit(movie);
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleTransactionSubmit = async (movie: Movie) => {
    if (!publicKey) {
      alert('Connect your wallet first');
      return;
    }

    const buffer = movie.serialize();
    const transaction = new Transaction();

    const [pda] = PublicKey.findProgramAddressSync(
      [publicKey.toBuffer(), new TextEncoder().encode(movie.title)],
      new PublicKey(MOVIE_REVIEW_PROGRAM_ID)
    );

    const instruction = new TransactionInstruction({
      keys: [
        {
          pubkey: publicKey,
          isSigner: true,
          isWritable: false,
        },
        {
          pubkey: pda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      data: buffer,
      programId: new PublicKey(MOVIE_REVIEW_PROGRAM_ID),
    });

    transaction.add(instruction);
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = recentBlockhash.blockhash;

    try {
      const transactionId = await sendTransaction(transaction, connection, {
        skipPreflight: true,
      });
      console.log(transactionId);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="py-4 px-6 max-w-[450px] flex items-center justify-center flex-col border border-gray-700 rounded-lg bg-gray-800 text-white"
    >
      <div className="mb-4">
        <label className="block text-gray-400 mb-2" htmlFor="title">
          Movie Title
        </label>
        <input
          id="title"
          className="p-2 w-[400px] bg-gray-700 border border-gray-600 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-400 mb-2" htmlFor="review">
          Add Your Review
        </label>
        <textarea
          id="review"
          className="w-[400px] p-2 bg-gray-700 border border-gray-600 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-center text-gray-400 mb-2"
          htmlFor="rating"
        >
          Select Rating
        </label>
        <div className="flex  space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              className={`h-8 w-8 cursor-pointer ${
                star <= rating ? 'text-yellow-400' : 'text-gray-500'
              }`}
              onClick={() => handleStarClick(star)}
            />
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="w-[400px] p-2 bg-green-600 hover:bg-green-700 rounded"
      >
        Submit Review
      </button>
    </form>
  );
};